import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entity/user.entity';
import { Authenticator } from '../../entity/authenticator.entity';
import { JwtService } from '@nestjs/jwt';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

import type {
  VerifiedRegistrationResponse,
  PublicKeyCredentialRequestOptionsJSON,
  VerifiedAuthenticationResponse,
  AuthenticationResponseJSON,
  RegistrationResponseJSON
} from '@simplewebauthn/server';
import { webAuthnConfig } from '../../config/webauthn.config';
import { Buffer } from 'node:buffer';

@Injectable()
export class WebauthnService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Authenticator)
    private authenticatorsRepository: Repository<Authenticator>,
    private jwtService: JwtService
  ) {
  }

  //注册流程

  async generateRegistrationOption(userId :number) {
    const user: User | null = await this.userRepository.findOne({ where: { id: userId } });
    if(!user) {
      throw new Error('未能找到指定的用户');
    }

    const existingAuthenticators = await this.authenticatorsRepository.find({
      where: { user: { id: userId } },
      select: [
        'webauthnUserID',  // 用作 excludeCredentials 的 id
        'transports'       // 可选的 transports 信息
      ]
    });

    // 构建排除列表，将已存在的认证器转换为 PublicKeyCredentialDescriptor 格式
    const excludeCredentials = existingAuthenticators.map(authenticator => ({
      id: authenticator.webauthnUserID,
      type: 'public-key' as const,
      transports: authenticator.transports // 如果 transports 是 JSON 字符串，需要解析
    }));

    const options = await generateRegistrationOptions({
      rpName: webAuthnConfig.rpName,
      rpID: webAuthnConfig.rpID,
      userID: new TextEncoder().encode(userId.toString()),
      userName: user.username,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        requireResidentKey: true,
        // authenticatorAttachment: 'platform',
      }
    })

    user.currentChallenge = options.challenge;
    await this.userRepository.save(user);

    return options;
  }

  async verifyRegistrationResponse(userId: number, response:RegistrationResponseJSON) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const expectedChallenge = user.currentChallenge;
    if (!expectedChallenge) {
      throw new Error('未找到有效的认证挑战');
    }

    const origin = webAuthnConfig.origin;

    // 验证注册响应
    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: webAuthnConfig.rpID,
      });
    } catch (error) {
      console.error('注册验证失败:', error);
      throw new Error(`注册验证失败: ${error}`);
    }

    const { verified, registrationInfo } = verification;

    // 如果验证成功，保存认证器信息并清除挑战
    if (verified && registrationInfo) {
      const authenticator = new Authenticator();
      authenticator.webauthnUserID = registrationInfo.credential.id;
      authenticator.user = user;
      authenticator.id = registrationInfo.credential.id;
      authenticator.counter = registrationInfo.credential.counter;
      authenticator.transports = registrationInfo.credential.transports || [];
      authenticator.backup = registrationInfo.credentialBackedUp;
      authenticator.deviceType = registrationInfo.credentialDeviceType;
      authenticator.publicKey = Buffer.from(registrationInfo.credential.publicKey).toString('base64');


      await this.authenticatorsRepository.save(authenticator);

      user.currentChallenge = null;
      await this.userRepository.save(user);
    }

    return verified;
  }


  //登录鉴权
  async generateAuthenticationOptions(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const userPasskeys: Authenticator[] = await this.authenticatorsRepository.find({
      where: {
        user: { id: userId }
      }
    });

    const options: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
      rpID: webAuthnConfig.rpID,
      allowCredentials: userPasskeys.map((authenticator) => ({
        id: authenticator.id,
        transports: authenticator.transports,
      })),
    });

    user.currentChallenge = options.challenge;
    await this.userRepository.save(user);

    return options;
  }

  async verifyAuthenticationOption(userId: number, body: AuthenticationResponseJSON) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    if (!user.currentChallenge) {
      throw new Error('无效的身份验证会话，找不到challenge');
    }

    const authenticator: Authenticator | null = await this.authenticatorsRepository.findOne({
      where: {
        id: body.id,
        user: { id: userId }
      }
    });

    if (!authenticator) {
      throw new Error(`找不到用户 ${userId} 的通行密钥 ${body.id}`);
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: webAuthnConfig.origin,
        expectedRPID: webAuthnConfig.rpID,
        credential: {
          id: authenticator.id,
          publicKey: Buffer.from(authenticator.publicKey, 'base64'),
          counter: authenticator.counter,
          transports: authenticator.transports,
        },
      });
    } catch (error) {
      console.error('身份验证验证失败:', error);
      throw new Error(`身份验证验证失败: ${error}`);
    }

    const { verified } = verification;
    if( verified ) {
      authenticator.counter = verification.authenticationInfo.newCounter;
      await this.authenticatorsRepository.save(authenticator);

      user.currentChallenge = null;
      await this.userRepository.save(user);
    }

    return verified;

  }

}

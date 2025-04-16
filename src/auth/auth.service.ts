import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../features/user/user.service';
import { SignInDTO, SignUpDTO } from '../features/user/user.type';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { HashingService } from './hashing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from './interface/active-user-data.interface';
import { Response } from 'express';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>
  ) {}

  async signUp(user: SignUpDTO) {
    const { email, username, password } = user;

    const emailValue = email ?? '';
    const usernameValue = username ?? '';
    const existingEmail = await this.usersService.findByEmail(emailValue);
    const existingUsername = await this.usersService.findByUsername(usernameValue);
    if(existingEmail || existingUsername) {
      throw new UnauthorizedException("该用户已经被注册");
    }

    // 获取用户组实体
    const groupName = user.userGroup || 'common';
    const userGroup = await this.usersService.findUserGroupByName(groupName);

    if (!userGroup) {
      throw new UnauthorizedException(`用户组 '${groupName}' 不存在`);
    }

    const hashedPassword = await this.hashingService.hash(password);

    // 创建用户时指定用户组实体
    const newUser = this.userRepository.create({
      email,
      username,
      password: hashedPassword,
      userGroup: userGroup,
      userGroupId: userGroup.id
    });

    return this.userRepository.save(newUser);
  }

  async signIn(user: SignInDTO, response: Response) {
    const { email, username, password } = user;
    const emailValue = email ?? '';
    const usernameValue = username ?? '';
    const existingUser = await this.usersService.findByEmail(emailValue) || await this.usersService.findByUsername(usernameValue);
    if (!existingUser) {
      throw new UnauthorizedException('用户不存在');
    }
    const isEqual = await this.hashingService.compare(password, existingUser.password);
    if (!isEqual) {
      throw new UnauthorizedException('密码错误');
    }

    const { access_token, refresh_token } = await this.generateTokens(existingUser);
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      maxAge: this.jwtConfiguration.accessTokenTtl,
      expires: new Date(Date.now() +  60 * 60 * 1000)
    })

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + this.jwtConfiguration.refreshTokenTtl * 1000)
    });

    return {
      message: '登录成功',
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email
      }
    };
  }

  async generateTokens(user: User) {
    const userData: Partial<ActiveUserData> = {
      name: user.username
    };

    // 如果用户有用户组，添加到 token 中
    if (user.userGroup) {
      userData.userGroup = user.userGroup.name;
    }

    const [access_token, refresh_token] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        userData,
        this.jwtConfiguration.accessTokenTtl,
      ),
      this.signToken(
        user.id,
        {},
        this.jwtConfiguration.refreshTokenTtl
      )
    ]);

    return { access_token, refresh_token };
  }

  private async signToken<T>(userId: number, payload?: T, expiresIn?: number) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn: expiresIn,
      },
    )
  }

  async refreshTokens(refreshToken: string, response: Response) {
    try {
      // 验证刷新令牌
      const payload = await this.jwtService.verifyAsync<{ sub: number }>(
        refreshToken,
        {
          secret: this.jwtConfiguration.secret,
          audience: this.jwtConfiguration.audience,
          issuer: this.jwtConfiguration.issuer,
        }
      );

      const user = await this.usersService.findUserById(payload.sub);
      if (!user) {
        console.log('用户不存在');
        throw new UnauthorizedException('用户不存在');
      }

      // 生成新的令牌
      const { access_token, refresh_token } = await this.generateTokens(user);

      // 设置新的cookie
      response.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + this.jwtConfiguration.accessTokenTtl * 1000)
      });

      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + this.jwtConfiguration.refreshTokenTtl * 1000)
      });

      return {
        message: '令牌刷新成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (_error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }


  async generateTokensForUser(userId: number, response: Response) {
    // 查找用户
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 使用现有的generateTokens方法生成令牌
    const { access_token, refresh_token } = await this.generateTokens(user);

    // 设置cookie，复用你现有的cookie配置
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: this.jwtConfiguration.accessTokenTtl,
      expires: new Date(Date.now() + 60 * 60 * 1000)
    });

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + this.jwtConfiguration.refreshTokenTtl * 1000)
    });

    // 返回用户信息
    return {
      message: 'Passkey 登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }


}

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO, SignUpDTO } from '../features/user/user.type';
import { Request, Response } from 'express';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UserGroups } from '../common/decorators/user-group.decorator';
import { UserGroupGuard } from './guards/user-group.guard';
import { AccessControl, AccessLevel } from '../common/decorators/access-controll.decorator';
import { REQUEST_USER_KEY } from '../constants';
import { WebauthnService } from '../features/webauthn/webauthn.service';


interface RequestWithUser extends Request {
  [REQUEST_USER_KEY]?: {
    userGroup?: string;
    sub?: number;
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly  authService: AuthService,
    private readonly webauthnService: WebauthnService,
  ) {}

  @AccessControl(AccessLevel.PUBLIC)
  @Post('signup')
  async signUp(@Body() user: SignUpDTO) {
    return await this.authService.signUp(user);
  }

  @AccessControl(AccessLevel.PUBLIC)
  @Post('signin')
  async signIn(@Body() user: SignInDTO, @Res({ passthrough: true }) response: Response) {
    return await this.authService.signIn(user, response);
  }

  @Post('refresh')
  @AccessControl(AccessLevel.PUBLIC)
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies['refresh_token'];
    return this.authService.refreshTokens(refreshToken, response);
  }

  @Get('verifyAdmin')
  @AccessControl(AccessLevel.REQUIRED_AUTH)
  @UseGuards(UserGroupGuard)
  @UserGroups('admin')
  // @UseGuards(JwtAuthGuard)
  verifyToken() {
    return { authenticated: true };
  }

  @Post('signout')
  signOut(@Res({ passthrough: true }) response: Response) {
    // 清除所有认证cookie
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { message: '已退出登录' };
  }

  @Get('status')
  @AccessControl(AccessLevel.OPTIONAL_AUTH)
  checkAuth(@Req() request: RequestWithUser) {
    const user = request[REQUEST_USER_KEY];
    if (user) {
      return {
        userId: request[REQUEST_USER_KEY]?.sub,
      };
    }

    return {
      userId: 0,
    };
  }

  // passkey实现
  // Passkey 注册流程 - 步骤 1: 生成注册选项
  @Post('passkey/register/options')
  @AccessControl(AccessLevel.REQUIRED_AUTH)
  async generateRegistrationOptions(@Req() request: RequestWithUser) {
    const userId = request[REQUEST_USER_KEY]?.sub;
    if (!userId) {
      throw new Error('用户未认证');
    }

    return await this.webauthnService.generateRegistrationOption(userId);
  }

  // Passkey 注册流程 - 步骤 2: 验证注册响应
  @Post('passkey/register/verify')
  @AccessControl(AccessLevel.REQUIRED_AUTH)
  async verifyRegistration(
    @Body() response: RegistrationResponseJSON,
    @Req() request: RequestWithUser
  ) {
    const userId = request[REQUEST_USER_KEY]?.sub;
    if (!userId) {
      throw new Error('用户未认证');
    }

    const verified = await this.webauthnService.verifyRegistrationResponse(userId, response);
    return { verified };
  }

  // Passkey 登录流程 - 步骤 1: 生成认证选项
  @Post('passkey/login/options')
  @AccessControl(AccessLevel.PUBLIC)
  @HttpCode(HttpStatus.OK)
  async generateAuthenticationOptions(@Body() body: { userId: number }) {
    const { userId } = body;
    return await this.webauthnService.generateAuthenticationOptions(userId);
  }

  // Passkey 登录流程 - 步骤 2: 验证认证响应
  @Post('passkey/login/verify')
  @AccessControl(AccessLevel.PUBLIC)
  @HttpCode(HttpStatus.OK)
  async verifyAuthentication(
    @Body() body: { userId: number; authenticationResponse: AuthenticationResponseJSON },
    @Res({ passthrough: true }) response: Response
  ) {
    const { userId, authenticationResponse } = body;

    const verified = await this.webauthnService.verifyAuthenticationOption(userId, authenticationResponse);

    if (verified) {
      // 如果验证成功，生成 JWT 令牌并设置 cookie
      return await this.authService.generateTokensForUser(userId, response);
    }

    return { verified };
  }
}

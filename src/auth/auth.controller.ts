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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthResponseDto,
  AuthStatusResponseDto,
  PasskeyLoginOptionsRequestDto,
  PasskeyLoginOptionsResponseDto,
  PasskeyLoginVerifyRequestDto,
  PasskeyLoginVerifyResponseDto,
  PasskeyRegistrationOptionsResponseDto,
  PasskeyRegistrationVerifyRequestDto,
  PasskeyRegistrationVerifyResponseDto,
  RefreshTokenResponseDto,
  SignOutResponseDto,
  VerifyAdminResponseDto
} from './auth.type';


interface RequestWithUser extends Request {
  [REQUEST_USER_KEY]?: {
    userGroup?: string;
    sub?: number;
  };
}

@ApiTags('认证')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly  authService: AuthService,
    private readonly webauthnService: WebauthnService,
  ) {}

  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: SignUpDTO })
  @ApiResponse({ status: 201, description: '注册成功' })
  @AccessControl(AccessLevel.PUBLIC)
  @Post('signup')
  async signUp(@Body() user: SignUpDTO) {
    return await this.authService.signUp(user);
  }

  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: SignInDTO })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @AccessControl(AccessLevel.PUBLIC)
  @Post('signin')
  async signIn(@Body() user: SignInDTO, @Res({ passthrough: true }) response: Response) {
    return await this.authService.signIn(user, response);
  }

  @ApiOperation({ summary: '刷新令牌' })
  @ApiResponse({ status: 200, type: RefreshTokenResponseDto })
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

  @ApiOperation({ summary: '验证管理员权限' })
  @ApiResponse({ status: 200, type: VerifyAdminResponseDto })
  @Get('verifyAdmin')
  @AccessControl(AccessLevel.REQUIRED_AUTH)
  @UseGuards(UserGroupGuard)
  @UserGroups('admin')
  // @UseGuards(JwtAuthGuard)
  verifyToken() {
    return { authenticated: true };
  }

  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, type: SignOutResponseDto })
  @Post('signout')
  signOut(@Res({ passthrough: true }) response: Response) {
    // 清除所有认证cookie
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { message: '已退出登录' };
  }

  @ApiOperation({ summary: '检查认证状态' })
  @ApiResponse({ status: 200, type: AuthStatusResponseDto })
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
  @ApiOperation({ summary: '生成 Passkey 注册选项' })
  @ApiResponse({ status: 200, type: PasskeyRegistrationOptionsResponseDto })
  @Post('passkey/register/options')
  @AccessControl(AccessLevel.REQUIRED_AUTH)
  async generateRegistrationOptions(@Req() request: RequestWithUser) {
    const userId = request[REQUEST_USER_KEY]?.sub;
    if (!userId) {
      throw new Error('用户未认证');
    }

    return await this.webauthnService.generateRegistrationOption(userId);
  }

  @ApiOperation({ summary: '验证 Passkey 注册' })
  @ApiBody({ type: PasskeyRegistrationVerifyRequestDto })
  @ApiResponse({ status: 200, type: PasskeyRegistrationVerifyResponseDto })
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

  @ApiOperation({ summary: '生成 Passkey 登录选项' })
  @ApiBody({ type: PasskeyLoginOptionsRequestDto })
  @ApiResponse({ status: 200, type: PasskeyLoginOptionsResponseDto })
  @Post('passkey/login/options')
  @AccessControl(AccessLevel.PUBLIC)
  @HttpCode(HttpStatus.OK)
  async generateAuthenticationOptions(@Body() body: { userId: number }) {
    const { userId } = body;
    return await this.webauthnService.generateAuthenticationOptions(userId);
  }

  @ApiOperation({ summary: '验证 Passkey 登录' })
  @ApiBody({ type: PasskeyLoginVerifyRequestDto })
  @ApiResponse({ status: 200, type: PasskeyLoginVerifyResponseDto })
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

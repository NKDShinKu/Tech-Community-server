import { ApiProperty } from '@nestjs/swagger';
import {
  RegistrationResponseJSON,
  AuthenticationResponseJSON
} from '@simplewebauthn/server';

// 用于身份认证的基本响应
export class AuthResponseDto {
  @ApiProperty({ description: '访问令牌' })
  access_token: string;

  @ApiProperty({ description: '令牌类型', example: 'bearer' })
  token_type: string;
}

// 验证管理员身份的响应
export class VerifyAdminResponseDto {
  @ApiProperty({ description: '是否通过认证', example: true })
  authenticated: boolean;
}

// 退出登录响应
export class SignOutResponseDto {
  @ApiProperty({ description: '退出登录消息', example: '已退出登录' })
  message: string;
}

// 认证状态响应
export class AuthStatusResponseDto {
  @ApiProperty({ description: '用户ID，如未登录则为0', example: 1 })
  userId: number;
}

// Passkey 注册选项响应
export class PasskeyRegistrationOptionsResponseDto {
  @ApiProperty({ description: 'Passkey 注册选项' })
  challenge: string;

  @ApiProperty({ description: 'RPID' })
  rpId: string;

  // 其他注册选项相关字段
}

// Passkey 注册验证请求
export class PasskeyRegistrationVerifyRequestDto {
  @ApiProperty({ description: '客户端注册响应' })
  response: RegistrationResponseJSON;
}

// Passkey 注册验证响应
export class PasskeyRegistrationVerifyResponseDto {
  @ApiProperty({ description: '验证结果', example: true })
  verified: boolean;
}

// Passkey 登录选项请求
export class PasskeyLoginOptionsRequestDto {
  @ApiProperty({ description: '用户ID' })
  userId: number;
}

// Passkey 登录选项响应
export class PasskeyLoginOptionsResponseDto {
  @ApiProperty({ description: 'Passkey 登录选项' })
  challenge: string;

  @ApiProperty({ description: '允许的凭证列表' })
  allowCredentials: any[];
}

// Passkey 登录验证请求
export class PasskeyLoginVerifyRequestDto {
  @ApiProperty({ description: '用户ID' })
  userId: number;

  @ApiProperty({ description: '客户端认证响应' })
  authenticationResponse: AuthenticationResponseJSON;
}

// Passkey 登录验证响应
export class PasskeyLoginVerifyResponseDto {
  @ApiProperty({ description: '验证结果', example: true })
  verified: boolean;

  @ApiProperty({ description: '访问令牌', required: false })
  access_token?: string;

  @ApiProperty({ description: '令牌类型', required: false, example: 'bearer' })
  token_type?: string;
}

// 刷新令牌响应
export class RefreshTokenResponseDto extends AuthResponseDto {}

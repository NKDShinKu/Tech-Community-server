import { ApiProperty } from '@nestjs/swagger';

export class SignUpDTO {
  @ApiProperty({ description: 'email'})
  email?: string;

  @ApiProperty({ description: '用户名'})
  username?: string;

  @ApiProperty({ description: '密码'})
  password: string;

  @ApiProperty({ description: '用户组'})
  userGroup?: string;
}

export class SignInDTO {
  @ApiProperty({ description: 'email'})
  email: string;

  @ApiProperty({ description: '用户名'})
  username: string;

  @ApiProperty({ description: '密码'})
  password: string;
}

export class GetAllUsersResponseDTO {
  @ApiProperty({ description: '用户ID', type: Number })
  id: number;

  @ApiProperty({ description: '邮箱', type: String })
  email: string;

  @ApiProperty({ description: '用户名', type: String })
  username: string;

  @ApiProperty({ description: '用户组', type: String })
  userGroup: string;

  @ApiProperty({ description: '创建时间', type: Date })
  createdAt: Date;
}

export class GetUserByEmailResponseDTO {
  @ApiProperty({ description: '用户ID', type: Number })
  id: number;

  @ApiProperty({ description: '邮箱', type: String })
  email: string;

  @ApiProperty({ description: '用户名', type: String })
  username: string;

  @ApiProperty({ description: '用户组', type: String })
  userGroup: string;

  @ApiProperty({ description: '创建时间', type: Date })
  createdAt: Date;
}

export class GetUserInfoResponseDTO {
  @ApiProperty({ description: '用户ID', type: Number })
  id: number;

  @ApiProperty({ description: '用户名', type: String })
  username: string;

  @ApiProperty({ description: '头像', type: String, nullable: true })
  avatar?: string;
}

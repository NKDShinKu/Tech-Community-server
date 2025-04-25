import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserGroups } from '../../common/decorators/user-group.decorator';
import { AccessControl, AccessLevel } from '../../common/decorators/access-controll.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllUsersResponseDTO, GetUserByEmailResponseDTO, GetUserInfoResponseDTO } from './user.type';

@ApiTags('用户')
@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  @UserGroups('admin')
  @ApiOperation({ summary: '获取所有用户列表', description: '仅管理员可访问' })
  @ApiResponse({ type: [GetAllUsersResponseDTO], status: 200 })
  async getAllUsers() {
    return await this.userService.findAllUsers();
  }

  @Get(':email')
  @UserGroups('admin')
  @ApiOperation({ summary: '根据邮箱获取用户', description: '仅管理员可访问' })
  @ApiResponse({ type: GetUserByEmailResponseDTO, status: 200 })
  async getUser(@Param('email') email: string) {
    return await this.userService.findByEmail(email);
  }

  @Get('info/:id')
  @AccessControl(AccessLevel.OPTIONAL_AUTH)
  @ApiOperation({ summary: '获取用户基本信息', description: '可选认证' })
  @ApiResponse({ type: GetUserInfoResponseDTO, status: 200 })
  async getUserInfo(@Param('id') id: number) {
    return await this.userService.findUserBaseInfo(id);
  }
}

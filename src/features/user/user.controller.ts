import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { UserGroups } from '../../common/decorators/user-group.decorator';
import { AccessControl, AccessLevel } from '../../common/decorators/access-controll.decorator';
import { User } from '../../entity/user.entity';

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  @UserGroups('admin')
  async getAllUsers() {
    return await this.userService.findAllUsers();
  }

  @Get(':email')
  @UserGroups('admin')
  async getUser(@Param('email') email: string) {
    return await this.userService.findByEmail(email);
  }

  @Get('info/:id')
  @AccessControl(AccessLevel.OPTIONAL_AUTH)
  async getUserInfo(@Param('id') id: number) {
    return await this.userService.findUserBaseInfo(id);
  }

  @Post('update-info')
  @AccessControl(AccessLevel.REQUIRED_AUTH)
  async updateUserInfo(@Query('id') id: number, @Body() userInfo :Partial<User>) {
    return await this.userService.updateUserInfo(id, userInfo);
  }
}

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDTO } from './posts.type';
import { Public } from '../../common/decorators/public.decorator';
import { REQUEST_USER_KEY } from '../../constants';
import { UserGroup } from '../../common/enum/user-groups.enum';
import { AccessControl, AccessLevel } from '../../common/decorators/access-controll.decorator';
import { UserGroupGuard } from '../../auth/guards/user-group.guard';
import { UserGroups } from '../../common/decorators/user-group.decorator';

interface RequestWithUser extends Request {
  [REQUEST_USER_KEY]?: {
    userGroup?: string;
  };
}

@Controller('api/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(@Body() post: CreatePostDTO) {
    return await this.postsService.createPost(post);
  }


  @AccessControl(AccessLevel.OPTIONAL_AUTH)
  // @UseGuards(UserGroupGuard)
  @Get('list')
  async getAllPosts(@Req() req: RequestWithUser) {
    const userGroup = req[REQUEST_USER_KEY]?.userGroup;
    const userGroupValue = this.getUserGroupValue(userGroup);
    return await this.postsService.getAllPosts(userGroupValue);
  }

  @AccessControl(AccessLevel.OPTIONAL_AUTH)
  @Public()
  @Get(':id')
  async getPostById(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const userGroup = req[REQUEST_USER_KEY]?.userGroup;
    const userGroupValue = this.getUserGroupValue(userGroup);
    return await this.postsService.getPostById(id, userGroupValue);
  }

  private getUserGroupValue(groupName?: string): number {
    if (!groupName) {
      return UserGroup.PUBLIC; // 默认值
    }
    const normalizedName = groupName.toUpperCase();

    if (normalizedName in UserGroup && typeof UserGroup[normalizedName as keyof typeof UserGroup] === 'number') {
      return UserGroup[normalizedName as keyof typeof UserGroup] as number;
    }

    return UserGroup.PUBLIC;
  }

  @AccessControl(AccessLevel.REQUIRED_AUTH)
  @UseGuards(UserGroupGuard)
  @UserGroups("admin")
  @Delete(':id')
  async deletePostById(@Param('id', ParseIntPipe) id: number){
    return await this.postsService.deletePost(id);
  }
}

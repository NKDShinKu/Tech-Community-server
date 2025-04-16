// src/posts/guards/post-access.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PostsService } from '../../features/posts/posts.service';
import { REQUEST_USER_KEY } from '../../constants';
import { UserGroup } from '../../common/enum/user-groups.enum';

@Injectable()
export class PostAccessGuard implements CanActivate {
  constructor(private postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postId = parseInt(request.params.id, 10);

    const post = await this.postsService.getPostWithAccessLevel(postId);
    if (!post) return false;

    // 公开文章允许所有人访问
    if (post.accessLevel === UserGroup.PUBLIC) return true;

    // 获取用户信息和权限级别
    const user = request[REQUEST_USER_KEY];
    if (!user) throw new ForbiddenException('需要登录才能访问此内容');

    const userGroup = user.group || UserGroup.REGISTERED;

    // 检查用户权限级别是否足够
    if (userGroup >= post.accessLevel) return true;

    // 检查是否为文章作者

    throw new ForbiddenException('没有权限访问此内容');
  }
}

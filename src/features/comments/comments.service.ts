import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../../entity/comments.entity';
import { Repository, In, IsNull } from 'typeorm';
import { CreateCommentDTO } from './comments.type';
import { PostEntity } from '../../entity/posts.entity';
import { User } from '../../entity/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>
  ) {
  }

  async find(postId: number, page: number = 1, limit: number = 10) {
    // 第一步：查找顶层评论
    const [topComments, total] = await this.commentRepository.findAndCount({
      where: {
        article: { id: postId },
        parentId: IsNull(),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'replyToUser'],
    });
    if (topComments.length === 0) {
      return { total, list: [], page, limit };
    }
    // 提取顶层评论id
    const rootIds = topComments.map(c => c.id);
    // 第二步：查找所有相关的回复
    const replies = await this.commentRepository.find({
      where: { rootId: rootIds.length > 0 ? In(rootIds) : In([-1]) },
      order: { createdAt: 'ASC' },
      relations: ['user', 'replyToUser'],
    });
    // 第三步：组装两层树结构
    const topMap = new Map<number, any>();
    const result = topComments.map(c => {
      const item = { ...c, children: [] };
      topMap.set(c.id, item);
      return item;
    });
    for (const reply of replies) {
      // 如果 parentId 是顶层评论，正常挂载
      if (reply.parentId !== null && topMap.has(reply.parentId)) {
        topMap.get(reply.parentId).children.push({ ...reply, children: [] });
      } else if (reply.rootId !== null && topMap.has(reply.rootId)) {
        // 否则，挂到 rootId 对应的顶层评论下，并加 @用户名
        let content = reply.content;
        if (reply.replyToUser && reply.replyToUser.username) {
          content = `@${reply.replyToUser.username} ${content}`;
        }
        topMap.get(reply.rootId).children.push({ ...reply, content, children: [] });
      }
    }
    return { total, list: result, page, limit };
  }

  async comment(data: CreateCommentDTO) {
    const { content, parentId, postId, replyToUserId } = data;
    const newComment = this.commentRepository.create({
      content,
      parentId,
    });
    newComment.article = { id: postId } as PostEntity;
    newComment.user = { id: data.userId } as User;

    if( replyToUserId ) {
      newComment.replyToUser = { id: replyToUserId } as User;
    }

    if(parentId) {
      const parentComment = await this.commentRepository.findOne({where: { id: parentId }});
      if (parentComment) {
        newComment.rootId = parentComment.rootId || parentComment.id;
      } else {
        throw new Error(`不存在id为${parentId}的父评论`);
      }
    }

    return await this.commentRepository.save(newComment);
  }
}

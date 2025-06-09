import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../../entity/comments.entity';
import { Repository } from 'typeorm';
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
    console.log(`查询文章ID为${postId}的评论，页码：${page}，每页数量：${limit}`);
    return '完成测试';
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

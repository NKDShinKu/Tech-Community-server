import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDTO {
  @ApiProperty({ description: '文章ID', required: true })
  postId: number;

  @ApiProperty({ description: '评论内容', required: true })
  content: string;

  @ApiProperty({ description: '评论作者', required: true })
  userId: number;

  @ApiProperty({ description: '回复的用户ID', required: false })
  replyToUserId?: number;

  @ApiProperty({ description: '父评论ID', required: false })
  parentId?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

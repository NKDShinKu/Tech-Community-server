import { ApiProperty } from '@nestjs/swagger';
// import { AuditStatus } from '../../entity/posts.entity';

export class CreatePostDTO {
  @ApiProperty({ description: '文章ID'})
  id?: number;

  @ApiProperty({ description: '文章标题'})
  title: string;

  @ApiProperty({ description: '文章内容'})
  content: string;

  @ApiProperty({ description: '文章封面图', required: false })
  coverImage?: string;

  @ApiProperty({ description: '作者ID' })
  authorId: number;

  @ApiProperty({ description: '分类ID' })
  category: number;
}

export class UpdatePostAuditDTO {
  auditStatus: number;
  rejectReason?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PostResponse {
  id: string;
  title: string;
  date: string;
  content?: Record<string, unknown>;
  rejectReason?: string;
  coverImage?: string;
  quick_tag?: number;
  isFavorited?: boolean;
  viewCount?: number;
  author: {
    avatar: string | undefined;
    username: string;
  };
}

import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDTO {
  @ApiProperty({ description: '文章ID'})
  id?: number;

  @ApiProperty({ description: '文章标题'})
  title: string;

  @ApiProperty({ description: '文章内容'})
  content: string;

  @ApiProperty({ description: '文章描述'})
  description: string;

  @ApiProperty({ description: '文章封面'})
  cover?: string;

  @ApiProperty({ description: '快速文章类型'})
  quick_tag: number;

  @ApiProperty({ description: '数组文章类型'})
  common_tag?: string[];

  @ApiProperty({ description: '访问权限'})
  accessLevel?: number;
}

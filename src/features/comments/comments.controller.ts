import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AccessControl, AccessLevel } from '../../common/decorators/access-controll.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDTO, PaginationQuery } from './comments.type';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService
  ) {
  }

  @Get()
  @AccessControl(AccessLevel.PUBLIC)
  async findAll(@Query('postId') postId :number, @Query() query : PaginationQuery) {
    const page = query.page ? parseInt(query.page.toString()) : 1;
    const limit = query.limit ? parseInt(query.limit.toString()) : 10;
    return await this.commentsService.find(postId, page, limit);
  }

  @Post()
  @AccessControl(AccessLevel.REQUIRED_AUTH)
  async comment(@Body() data : CreateCommentDTO) {
    return await this.commentsService.comment(data);
  }
}

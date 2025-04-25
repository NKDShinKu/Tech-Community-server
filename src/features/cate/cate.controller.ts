import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CateService } from './cate.service';
import { AccessControl, AccessLevel } from '../../common/decorators/access-controll.decorator';

@Controller('api/cate')
export class CateController {
  constructor(private readonly cateService: CateService) {}

  @Get()
  @AccessControl(AccessLevel.PUBLIC)
  async findAll() {
    const categories = await this.cateService.findAll();
    return { categories };
  }

  @Post()
  @AccessControl(AccessLevel.PUBLIC)
  async create(@Body('categoryName') categoryName: string) {
    await this.cateService.create(categoryName);
    return { code: 200, message: '分类创建成功' };
  }

  @Put(':id')
  // @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: number, @Body('categoryName') categoryName: string) {
    await this.cateService.update(id, categoryName);
    return { code: 200, message: '分类更新成功' };
  }

  @Delete(':id')
  // @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: number) {
    await this.cateService.delete(id);
    return { code: 200, message: '分类删除成功' };
  }

  @Get(':id')
  // @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: number) {
    return await this.cateService.findOne(id);
  }
}

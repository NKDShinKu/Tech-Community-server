import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CateController } from './cate.controller';
import { CateService } from './cate.service';
import { CategoryEntity } from '../../entity/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  controllers: [CateController],
  providers: [CateService]
})
export class CateModule {}

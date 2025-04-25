import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../../entity/category.entity';

@Injectable()
export class CateService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>
  ) {}

  async findAll(): Promise<CategoryEntity[]> {
    return await this.categoryRepository.find();
  }

  async create(categoryName: string): Promise<CategoryEntity> {
    const category = new CategoryEntity();
    category.categoryName = categoryName;
    return await this.categoryRepository.save(category);
  }

  async update(id: number, categoryName: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    category.categoryName = categoryName;
    return await this.categoryRepository.save(category);
  }

  async delete(id: number): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('分类不存在');
    }
  }

  async findOne(id: number): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    return category;
  }
}

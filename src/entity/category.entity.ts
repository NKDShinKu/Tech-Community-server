import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('category')
export class CategoryEntity {
  @PrimaryGeneratedColumn({
    name: 'categoryId',
    type: 'int'
  })
  categoryId: number;

  @Column({
    name: 'categoryName',
    type: 'nvarchar',
    length: 50
  })
  categoryName: string;
}

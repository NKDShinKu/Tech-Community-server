import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cover: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'bigint', nullable: true })
  quick_tag: number;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  common_tag: string | null;  // 存储 JSON 字符串

  @Column({ type: 'nvarchar', length: 'max', nullable: false })
  content: string;  // 存储 JSON 数据

  @Column({ default: 0 })
  accessLevel: number;

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' })
  created_time: Date;

  @UpdateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' })
  edited_time: Date;
}

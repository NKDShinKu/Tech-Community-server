import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index, ManyToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';
import { PostEntity as Post } from './posts.entity';

@Entity('comments')
@Index(['rootId'])
// @Index(['articleId', 'parentId'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('nvarchar', { length: 'MAX' })
  content: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Post;
4
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser: User | null;

  @Column('int',{ nullable: true })
  parentId: number | null;

  @Column('int',{ nullable: true })
  rootId: number | null;


  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @Column({ type: 'int', default: 0 })
  likeCount: number;
}

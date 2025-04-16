import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../../entity/posts.entity';
import { Repository } from 'typeorm';
import { CreatePostDTO } from './posts.type';
import { LessThanOrEqual } from 'typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
  ) {}
  async createPost(post: CreatePostDTO) {
    // 检查是否存在相同ID的文章
    if (post.id) {
      const existingPost = await this.postsRepository.findOne({
        where: { id: post.id }
      });

      if (existingPost) {
        // 如果存在，执行更新操作
        return this.postsRepository.update(post.id, {
          title: post.title,
          description: post.description,
          content: JSON.stringify(post.content),
          cover: post.cover || '/img/cover1.png',
          accessLevel: post.accessLevel || 0,
          quick_tag: post.quick_tag,
          common_tag: Array.isArray(post.common_tag) ? JSON.stringify(post.common_tag) : null,
        });
      }
    }

    // 没有指定ID或ID不存在，创建新记录
    const obj = new PostEntity();
    obj.title = post.title;
    obj.description = post.description;
    obj.content = JSON.stringify(post.content);
    obj.cover = post.cover || '/img/cover1.png';
    obj.accessLevel = post.accessLevel || 0;
    obj.quick_tag = post.quick_tag;
    obj.common_tag = Array.isArray(post.common_tag) ? JSON.stringify(post.common_tag) : null;

    if (post.id) {
      obj.id = post.id;
    }

    return await this.postsRepository.save(obj);
  }

  async getAllPosts(userGroup: number = 0) {
    const posts = await this.postsRepository.find({
      where: { accessLevel: LessThanOrEqual(userGroup) },
      select: {
        id: true,
        title: true,
        created_time: true,
        quick_tag: true,
        common_tag: true,
        description: true,
        cover: true,
        accessLevel: true,
      },
      order: {
        created_time: 'DESC',
      },
    });

    return posts.map(post => ({
      id: post.id.toString(),
      title: post.title,
      date: post.created_time.toISOString(),
      cover: post.cover,
      quick_tag: post.quick_tag,
      common_tag: post.common_tag ? (JSON.parse(post.common_tag) as string[]) : [],
      accessLevel: post.accessLevel,
    }));
  }

  async getPostById(id: number, userGroup: number = 0) {
    const post = await this.postsRepository.findOne({
      where: { id },
      select: {
        id: true,
        title: true,
        created_time: true,
        quick_tag: true,
        common_tag: true,
        content: true,
        accessLevel: true,
        cover: true,
      },
    });

    if (!post) {
      return null;
    }

    if (post.accessLevel > userGroup) {
      throw new ForbiddenException('没有权限访问此内容');
    }

    return {
      title: post.title,
      date: post.created_time.toISOString(),
      quick_tag: post.quick_tag,
      common_tag: post.common_tag ? (JSON.parse(post.common_tag) as string[]) : [],
      cover: post.cover,
      content: post.content,
    };
  }

  async getPostWithAccessLevel(id: number) {
    return await this.postsRepository.findOne({
      where: { id },
      select: {
        id: true,
        accessLevel: true,
      },
    });
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new InternalServerErrorException("没有找到该文章");
    }
    return await this.postsRepository.delete(id);
  }
}

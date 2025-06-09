import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../../entity/posts.entity';
import { Repository, Like, Raw } from 'typeorm';
import { CreatePostDTO, UpdatePostAuditDTO, PostResponse, PaginatedResponse } from './posts.type';
import {
  ApprovedLine,
  PendingLine,
  RejectedLine,
  mergeLines,
  removeLine,
  includeSomeLine,
  DeletedLine,
} from '../../common/lib/quick-tag';
import { UserFavoritesEntity } from '../../entity/user-favorites.entity';
import { User } from '../../entity/user.entity';
import { CategoryEntity } from '../../entity/category.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
  ) {}

  async createPost(post: CreatePostDTO) {
    if (post.id) {
      const existingPost = await this.postsRepository.findOne({
        where: { id: post.id }
      });

      if (existingPost) {
        return this.postsRepository.update(post.id, {
          title: post.title,
          content: JSON.stringify(post.content),
          authorId: post.authorId,
          quick_tag: mergeLines(existingPost.quick_tag, PendingLine),
          coverImage: post.coverImage || '',
        });
      }
    }

    const obj = new PostEntity();
    obj.title = post.title;
    obj.content = JSON.stringify(post.content);
    obj.authorId = post.authorId;
    obj.quick_tag = PendingLine;
    obj.coverImage = post.coverImage || '';
    // 正确赋值category
    if (post.category) {
      const category = new CategoryEntity();
      category.categoryId = post.category;
      obj.category = category;
    }

    if (post.id) {
      obj.id = post.id;
    }

    return await this.postsRepository.save(obj);
  }

  async getAllPosts(page: number = 1, limit: number = 10): Promise<PaginatedResponse<{
    id: string;
    title: string;
    date: string;
    coverImage: string;
    quickTag: number;
    rejectReason: string;
    author: { avatar: string | undefined; username: string },
    category: CategoryEntity | undefined
  }>> {
    const [posts, total] = await this.postsRepository.findAndCount({
      relations: ['author', 'category'],
      select: {
        id: true,
        title: true,
        created_time: true,
        coverImage: true,
        quick_tag: true,
        rejectReason: true,
        author: {
          id: true,
          username: true,
          avatar: true
        }
      },
      order: {
        created_time: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        date: post.created_time.toISOString(),
        coverImage: post.coverImage,
        quickTag: post.quick_tag,
        rejectReason: post.rejectReason,
        author: {
          avatar: post.author.avatar,
          username: post.author.username
        },
        category: post.category || undefined
      })),
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }

  async getApprovedPosts(page: number = 1, limit: number = 10): Promise<{
    items: {
      id: string;
      title: string;
      date: string;
      coverImage: string;
      quickTag: number;
      author: { avatar: string | undefined; username: string };
      category: CategoryEntity | undefined
    }[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean
  }> {
    const [posts, total] = await this.postsRepository.findAndCount({
      where: {
        quick_tag: Raw(alias => `${alias} & ${ApprovedLine} = ${ApprovedLine}`)
      },
      relations: ['author', 'category'],
      select: {
        id: true,
        title: true,
        created_time: true,
        quick_tag: true,
        coverImage: true,
        author: {
          avatar: true,
          username: true
        }
        // 不要写category: true，TypeORM不支持
      },
      order: {
        created_time: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        date: post.created_time.toISOString(),
        coverImage: post.coverImage,
        quickTag: post.quick_tag,
        author: {
          avatar: post.author.avatar,
          username: post.author.username
        },
        category: post.category || undefined
      })),
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }

  async getRejectedPosts(page: number = 1, limit: number = 10): Promise<PaginatedResponse<{
    id: string;
    title: string;
    date: string;
    coverImage: string;
    quickTag: number;
    author: { avatar: string | undefined; username: string }
  }>> {
    const [posts, total] = await this.postsRepository.findAndCount({
      where: {
        quick_tag: Raw(alias => `${alias} & ${RejectedLine} = ${RejectedLine}`)
      },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        created_time: true,
        quick_tag: true,
        coverImage: true,
        author: {
          avatar: true,
          username: true
        }
      },
      order: {
        created_time: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        date: post.created_time.toISOString(),
        coverImage: post.coverImage,
        quickTag: post.quick_tag,
        author: {
          avatar: post.author.avatar,
          username: post.author.username
        }
      })),
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }

  async getPendingPosts(page: number = 1, limit: number = 10): Promise<PaginatedResponse<{
    id: string;
    title: string;
    date: string;
    coverImage: string;
    quickTag: number;
    author: { avatar: string | undefined; username: string }
  }>> {
    const [posts, total] = await this.postsRepository.findAndCount({
      where: {
        quick_tag: Raw(alias => `${alias} & ${PendingLine} = ${PendingLine}`)
      },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        created_time: true,
        quick_tag: true,
        coverImage: true,
        author: {
          avatar: true,
          username: true
        }
      },
      order: {
        created_time: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        date: post.created_time.toISOString(),
        coverImage: post.coverImage,
        quickTag: post.quick_tag,
        author: {
          avatar: post.author.avatar,
          username: post.author.username
        }
      })),
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }

  async getUserPosts(userId: number): Promise<{
    id: string;
    title: string;
    date: string;
    content: Record<string, unknown>;
    quickTag: number;
    rejectReason: string;
    coverImage: string;
    category: CategoryEntity | undefined
  }[]> {
    const posts = await this.postsRepository.find({
      where: { authorId: userId },
      relations: ['author', 'category'],
      select: {
        id: true,
        title: true,
        created_time: true,
        content: true,
        quick_tag: true,
        rejectReason: true,
        coverImage: true,
        // author: {
        //   id: true,
        //   username: true
        // }
      },
      order: {
        created_time: 'DESC',
      },
    });

    return posts.map(post => ({
      id: post.id.toString(),
      title: post.title,
      date: post.created_time.toISOString(),
      content: JSON.parse(post.content) as Record<string, unknown>,
      quickTag: post.quick_tag,
      rejectReason: post.rejectReason,
      coverImage: post.coverImage,
      category: post.category || undefined
    }));
  }

  async getPostById(id: number, currentUserId?: number): Promise<PostResponse | null> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'author.userGroup', 'category'],
      select: {
        id: true,
        title: true,
        created_time: true,
        content: true,
        quick_tag: true,
        rejectReason: true,
        authorId: true,
        coverImage: true,
        viewCount: true,
        author: {
          id: true,
          username: true,
          avatar: true,
          userGroup: {
            id: true,
            name: true
          }
        },
      },
    });

    if (!post) {
      return null;
    }

    // 添加用户组权限判断
    const currentUser = currentUserId ? await this.postsRepository.manager.findOne(User, {
      where: { id: currentUserId },
      relations: ['userGroup'],
    }) : null;

    const isAdminOrReviewer = currentUser?.userGroup?.name === 'admin' || currentUser?.userGroup?.name === 'reviewer';

    // 文章未通过审核，且不是作者本人或管理员/审核员，则无权查看
    if (!includeSomeLine(post.quick_tag, ApprovedLine) &&
      post.authorId !== currentUserId &&
      !isAdminOrReviewer) {
      console.log('没有权限查看该文章');
      return null;
    }

    let isFavorited = false;
    if (currentUserId) {
      const favoriteCount = await this.postsRepository.manager.count(UserFavoritesEntity, {
        where: { userId: currentUserId.toString(), postId: id.toString() },
      });
      isFavorited = favoriteCount > 0;
    }

    post.viewCount = (post.viewCount || 0) + 1;
    await this.postsRepository.save(post); // 更新浏览量

    return {
      id: post.id.toString(),
      title: post.title,
      date: post.created_time.toISOString(),
      content: JSON.parse(post.content) as Record<string, unknown>,
      rejectReason: post.rejectReason,
      coverImage: post.coverImage,
      quick_tag: post.quick_tag,
      viewCount: post.viewCount,
      author: {
        avatar: post.author.avatar,
        username: post.author.username
      },
      isFavorited,
      category: post.category || undefined
    };
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new InternalServerErrorException("没有找到该文章");
    }
    return await this.postsRepository.delete(id);
  }

  async updatePostAuditStatus(id: number, auditData: UpdatePostAuditDTO) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new InternalServerErrorException("没有找到该文章");
    }

    if (includeSomeLine(auditData.auditStatus, RejectedLine) && !auditData.rejectReason) {
      throw new InternalServerErrorException("拒绝文章时必须���供拒绝原因");
    }

    let updatedQuickTag = post.quick_tag;
    if (includeSomeLine(updatedQuickTag, ApprovedLine)) {
      updatedQuickTag = removeLine(updatedQuickTag, ApprovedLine);
    }
    if (includeSomeLine(updatedQuickTag, PendingLine)) {
      updatedQuickTag = removeLine(updatedQuickTag, PendingLine);
    }
    if (includeSomeLine(updatedQuickTag, RejectedLine)) {
      updatedQuickTag = removeLine(updatedQuickTag, RejectedLine);
    }
    if(includeSomeLine(updatedQuickTag, DeletedLine)) {
      updatedQuickTag = removeLine(updatedQuickTag, DeletedLine);
    }

    updatedQuickTag = mergeLines(updatedQuickTag, auditData.auditStatus);

    return await this.postsRepository.update(id, {
      quick_tag: updatedQuickTag,
      rejectReason: auditData.rejectReason,
    });
  }

  async getPostsByUsername(username: string): Promise<PostResponse[]> {
    const posts = await this.postsRepository.find({
      where: {
        author: {
          username: Like(`%${username}%`)
        }
      },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        created_time: true,
        quick_tag: true,
        author: {
          id: true,
          username: true
        }
      },
      order: {
        created_time: 'DESC',
      },
    });

    return posts.map(post => ({
      id: post.id.toString(),
      title: post.title,
      date: post.created_time.toISOString(),
      author: {
        avatar: post.author.avatar,
        username: post.author.username
      }
    }));
  }

  async searchApprovedPosts(keyword: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<{
    id: string;
    title: string;
    date: string;
    coverImage: string;
    quickTag: number;
    author: { avatar: string | undefined; username: string };
  }>> {
    const [posts, total] = await this.postsRepository.findAndCount({
      where: [
        {
          quick_tag: Raw(alias => `${alias} & ${ApprovedLine} = ${ApprovedLine}`),
          title: Like(`%${keyword}%`),
        },
        {
          quick_tag: Raw(alias => `${alias} & ${ApprovedLine} = ${ApprovedLine}`),
          content: Like(`%${keyword}%`),
        },
        {
          quick_tag: Raw(alias => `${alias} & ${ApprovedLine} = ${ApprovedLine}`),
        },
        {
          quick_tag: Raw(alias => `${alias} & ${ApprovedLine} = ${ApprovedLine}`),
          author: { username: Like(`%${keyword}%`) },
        },
      ],
      relations: ['author'],
      select: {
        id: true,
        title: true,
        created_time: true,
        quick_tag: true,
        coverImage: true,
        author: {
          avatar: true,
          username: true,
        },
      },
      order: {
        created_time: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        date: post.created_time.toISOString(),
        coverImage: post.coverImage,
        quickTag: post.quick_tag,
        author: {
          avatar: post.author.avatar,
          username: post.author.username,
        },
      })),
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './features/posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './features/user/user.module';
import { BackblazeModule } from './features/backblaze/backblaze.module';
import { JwtModule } from '@nestjs/jwt';
import { OssArchiveModule } from './features/oss-archive/oss-archive.module';
import { User } from './entity/user.entity';
import { CateModule } from './features/cate/cate.module';
import { CommentsModule } from './features/comments/comments.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    PostsModule,
    AuthModule,
    UserModule,
    BackblazeModule,
    JwtModule.register({
      global: true,
    }),
    TypeOrmModule.forFeature([User]),
    OssArchiveModule,
    CateModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}

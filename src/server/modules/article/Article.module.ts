import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {TagModule} from '../tag/Tag.module';
import {ArticleEntity} from './Article.entity';
import {ArticleController} from './Article.controller';
import {ArticleService} from './Article.service';

@Module(
  {
    imports: [
      TypeOrmModule.forFeature([ArticleEntity]),
      TagModule,
    ],
    providers: [
      ArticleService,
    ],
    controllers: [
      ArticleController,
    ],
  },
)
export class ArticleModule {}

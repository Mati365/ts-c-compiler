import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {ArticleCategoryEntity} from './ArticleCategory.entity';
import {ArticleCategoryService} from './ArticleCategory.service';
import {ArticleCategoryController} from './ArticleCategory.controller';

@Module(
  {
    imports: [
      TypeOrmModule.forFeature([ArticleCategoryEntity]),
    ],
    exports: [
      ArticleCategoryService,
    ],
    providers: [
      ArticleCategoryService,
    ],
    controllers: [
      ArticleCategoryController,
    ],
  },
)
export class ArticleCategoryModule {}

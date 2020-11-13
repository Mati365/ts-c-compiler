import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {ENV} from '@server/constants/env';
import {isDevMode} from '@server/shared/helpers';

import {TagEntity} from '@server/modules/tag/Tag.entity';
import {ArticleEntity} from '@server/modules/article/Article.entity';
import {ArticleCategoryEntity} from '../article-category/ArticleCategory.entity';
import {UserEntity} from '../user/User.entity';
import {UserScopeEntity} from '../user/Scope.entity';
import {AttachmentEntity} from '../attachment/Attachment.entity';

@Module(
  {
    imports: [
      TypeOrmModule.forRoot(
        {
          ...ENV.dbConfig,
          type: 'postgres',
          synchronize: false,
          logging: (
            isDevMode()
              ? 'all'
              : false
          ),
          entities: [
            ArticleEntity,
            TagEntity,
            ArticleCategoryEntity,
            UserEntity,
            AttachmentEntity,
            UserScopeEntity,
          ],
        },
      ),
    ],
  },
)
export class DatabaseModule {}

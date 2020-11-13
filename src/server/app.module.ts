import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';

import {IsUniqueValueConstraint} from '@server/validators/IsUniqueValue';
import {
  DatabaseModule,
  ArticleModule,
  ArticleCategoryModule,
  TagModule,
  UserModule,
  AuthModule,
  AttachmentModule,
} from './modules';

import {ENV} from './constants/env';

@Module(
  {
    imports: [
      ServeStaticModule.forRoot(
        {
          serveRoot: '/uploads',
          renderPath: '/uploads',
          rootPath: ENV.uploader.destination,
          serveStaticOptions: {
            index: false,
          },
        },
      ),
      DatabaseModule,
      UserModule,
      AuthModule,
      TagModule,
      ArticleCategoryModule,
      ArticleModule,
      AttachmentModule.register(),
    ],
    controllers: [],
    providers: [
      IsUniqueValueConstraint,
    ],
  },
)
export class AppModule {}

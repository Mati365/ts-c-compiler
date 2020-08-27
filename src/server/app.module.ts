import {resolve} from 'path';
import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';

import {IsUniqueValueConstraint} from './validators/IsUniqueValue';
import {AppController} from './app.controller';
import {
  DatabaseModule,
  ProjectModule,
  ManifestModule,
  TagModule,
} from './modules';

@Module(
  {
    imports: [
      ServeStaticModule.forRoot(
        {
          serveRoot: '/public',
          renderPath: '/public',
          rootPath: resolve(__dirname, 'public'),
          serveStaticOptions: {
            index: false,
          },
        },
      ),
      ManifestModule.forRoot(
        {
          filePath: resolve(__dirname, './public/manifest.json'),
        },
      ),
      DatabaseModule,
      TagModule,
      ProjectModule,
    ],
    controllers: [
      AppController,
    ],
    providers: [
      IsUniqueValueConstraint,
    ],
  },
)
export class AppModule {}

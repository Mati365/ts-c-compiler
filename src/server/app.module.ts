import {resolve} from 'path';
import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';

import {ManifestModule} from './modules';
import {AppController} from './app.controller';

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
    ],
    controllers: [
      AppController,
    ],
  },
)
export class AppModule {}

import {resolve} from 'path';
import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';

// import {TypeOrmModule} from '@nestjs/typeorm';
// import {Connection} from 'typeorm';

import {AppController} from './app.controller';
import {ManifestModule} from './modules/manifest';

@Module(
  {
    imports: [
      // TypeOrmModule.forRoot(),
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
    providers: [],
  },
)
export class AppModule {
  // constructor(private readonly connection: Connection) {}
}

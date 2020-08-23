import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import * as R from 'ramda';

import {AppModule} from './app.module';

const {APP_PORT} = process.env;

async function bootstrap(
  {
    address,
    port,
  }: {
    address: string,
    port: number,
  },
) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  await app.listen(port, address);
}

bootstrap(
  {
    address: R.defaultTo('127.0.0.1', process.env.APP_LISTEN_ADDRESS),
    port: (
      APP_PORT
        ? Number.parseInt(APP_PORT, 10)
        : 3000
    ),
  },
);

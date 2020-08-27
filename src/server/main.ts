import {NestFactory, Reflector} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {ClassSerializerInterceptor} from '@nestjs/common';
import {useContainer} from 'class-validator';
import * as R from 'ramda';

import './config';

import {LoggerInterceptor} from './interceptors/LoggerInterceptor';
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
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggerInterceptor,
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useContainer(
    app.select(AppModule),
    {
      fallbackOnErrors: true,
    },
  );
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

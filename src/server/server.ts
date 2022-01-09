import {NestFactory, Reflector} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {ClassSerializerInterceptor} from '@nestjs/common';

import {ccompiler} from '@compiler/x86-nano-c';

import {ENV} from './constants/env';
import {LoggerInterceptor} from './interceptors/Logger.interceptor';
import {AppModule} from './app.module';

ccompiler(
  /* cpp */ `
    enum {
      ONE = 1,
      TWO = 2,
    };

    int main() {
      int var = { ONE + TWO + (2 + 3 * TWO) };

      return 0;
    }
  `,
).match(
  {
    ok: (result) => {
      result.dump();
    },
    err: (error) => {
      console.error(error);
    },
  },
);

async function bootstrap(
  {
    address,
    port,
  }: {
    address: string,
    port: number,
  },
) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {cors: true});
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggerInterceptor,
  );

  await app.listen(port, address);
  console.info(`API server is running at http://${address}:${port}!`);
}

bootstrap(
  {
    address: ENV.listen.address,
    port: ENV.listen.port,
  },
);

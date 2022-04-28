import {NestFactory, Reflector} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {ClassSerializerInterceptor} from '@nestjs/common';

import {ccompiler, CCompilerOutput} from '@compiler/x86-nano-c';

import {ENV} from './constants/env';
import {LoggerInterceptor} from './interceptors/Logger.interceptor';
import {AppModule} from './app.module';

ccompiler(
  /* cpp */ `
    struct { int a[3], b, c; } w[] =
    { [1].a = {2}, [1].c = 3, [0].b = 6, [0].a = { 6 } };
  `,
).match(
  {
    ok: (result) => {
      result.dump();
    },
    err: (error: any) => {
      if (error?.[0]?.tree) {
        console.info(
          CCompilerOutput.serializeTypedTree(error[0].tree),
        );
      }

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

import * as R from 'ramda';
import {Request} from 'express';
import {Observable} from 'rxjs';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';

import {UploadedFileDto} from '../dto';

export function FormAttachmentsBodyInterceptor(): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      const ctx = context.switchToHttp();
      const req: Request = ctx.getRequest();
      const {body} = req;

      if (R.keys(body).length === 1 && body && R.is(String, body.body)) {
        req.body = JSON.parse(body.body);

        (<Express.Multer.File[]> req.files || []).forEach(
          ({mimetype, originalname, filename, size}) => {
            req.body = R.set(
              R.lensPath(originalname.split('.')),
              new UploadedFileDto(
                {
                  file: filename,
                  mimetype,
                  size,
                },
              ),
              req.body,
            );
          },
        );
      }

      return next.handle();
    }
  }

  return <Type<NestInterceptor>> mixin(MixinInterceptor);
}

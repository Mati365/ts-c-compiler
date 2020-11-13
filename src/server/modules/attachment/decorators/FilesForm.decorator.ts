import {UseInterceptors} from '@nestjs/common';
import {FilesInterceptor} from '@nestjs/platform-express';
import {FormAttachmentsBodyInterceptor} from '../interceptors/FormAttachmentsBody.interceptor';

/* eslint-disable */

export const FilesForm = () => UseInterceptors(
  FilesInterceptor('files', 1),
  FormAttachmentsBodyInterceptor(),
);

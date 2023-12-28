import { ALLOCA_CONTENT_HEADER } from './alloca.h';
import { STD_ARG_CONTENT_HEADER } from './stdarg.h';
import { STD_IO_CONTENT_HEADER } from './stdio.h';
import { STRING_CONTENT_HEADER } from './string.h';

export const STD_HEADERS_FILES = {
  'stdarg.h': STD_ARG_CONTENT_HEADER,
  'stdio.h': STD_IO_CONTENT_HEADER,
  'string.h': STRING_CONTENT_HEADER,
  'alloca.h': ALLOCA_CONTENT_HEADER,
};

import * as E from 'fp-ts/Either';

import {
  CPreprocessorError,
  CPreprocessorErrorCode,
} from '../frontend/preprocessor/grammar/CPreprocessorError';

import type {
  CInterpreterIncludeResolver,
  CInterpreterSourceFile,
  CInterpreterSourcePath,
} from '../frontend/preprocessor';

import { STD_ARG_CONTENT_HEADER } from './stdarg.h';

export class CInternalCompilerFsResolver
  implements CInterpreterIncludeResolver
{
  read =
    () =>
    (
      path: CInterpreterSourcePath,
    ): E.Either<CPreprocessorError, CInterpreterSourceFile> => {
      const vfsFile = CInternalCompilerFsResolver.FILES[path.filename];

      if (!path.system || !vfsFile) {
        return E.left(
          new CPreprocessorError(
            CPreprocessorErrorCode.CANNOT_INCLUDE_FILE,
            null,
            {
              name: path.filename,
            },
          ),
        );
      }

      return E.right({
        absolutePath: path.filename,
        content: vfsFile,
      });
    };

  private static FILES = {
    'stdarg.h': STD_ARG_CONTENT_HEADER,
  };
}

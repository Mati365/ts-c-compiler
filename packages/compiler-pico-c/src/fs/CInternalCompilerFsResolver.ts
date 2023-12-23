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

import { KERNEL_HEADERS_FILES } from './kernel';
import { STD_HEADERS_FILES } from './std';

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
    ...KERNEL_HEADERS_FILES,
    ...STD_HEADERS_FILES,
  };
}

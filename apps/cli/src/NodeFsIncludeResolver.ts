import * as E from 'fp-ts/Either';

import {
  CInterpreterIncludeResolver,
  CInterpreterSourceFile,
  CInterpreterSourcePath,
  CPreprocessorError,
  CPreprocessorErrorCode,
} from '@ts-c-compiler/compiler';

export class NodeFsIncludeResolver implements CInterpreterIncludeResolver {
  read(
    path: CInterpreterSourcePath,
  ): E.Either<CPreprocessorError, CInterpreterSourceFile> {
    return E.left(
      new CPreprocessorError(CPreprocessorErrorCode.CANNOT_INCLUDE_FILE, null, {
        name: path.filename,
      }),
    );
  }
}

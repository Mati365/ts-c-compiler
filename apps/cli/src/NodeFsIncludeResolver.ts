import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import * as E from 'fp-ts/Either';

import {
  CInterpreterIncludeResolver,
  CInterpreterSourceFile,
  CInterpreterSourcePath,
  CPreprocessorError,
  CPreprocessorErrorCode,
} from '@ts-cc/compiler';

export class NodeFsIncludeResolver implements CInterpreterIncludeResolver {
  read =
    (currentFilePath: string) =>
    (
      path: CInterpreterSourcePath,
    ): E.Either<CPreprocessorError, CInterpreterSourceFile> => {
      const absolutePath = join(dirname(currentFilePath), path.filename);

      return E.tryCatch(
        () => ({
          content: readFileSync(absolutePath, {
            encoding: 'utf8',
          }),
          absolutePath,
        }),
        () =>
          new CPreprocessorError(CPreprocessorErrorCode.CANNOT_INCLUDE_FILE, null, {
            name: absolutePath,
          }),
      );
    };
}

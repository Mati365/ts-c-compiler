import type { Either } from 'fp-ts/Either';
import { CPreprocessorError } from 'frontend/preprocessor/grammar';

export type CInterpreterSourcePath = {
  system: boolean;
  filename: string;
};

export type CInterpreterSourceFile = {
  content: string;
};

export type CInterpreterIncludeResolver = {
  read(
    path: CInterpreterSourcePath,
  ): Either<CPreprocessorError, CInterpreterSourceFile>;
};

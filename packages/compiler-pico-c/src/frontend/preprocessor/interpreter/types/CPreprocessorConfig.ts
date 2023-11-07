import type { CInterpreterIncludeResolver } from './CInterpreterIncludeResolver';

export type CPreprocessorConfig = {
  currentFilePath?: string;
  fsIncludeResolver?: CInterpreterIncludeResolver;
};

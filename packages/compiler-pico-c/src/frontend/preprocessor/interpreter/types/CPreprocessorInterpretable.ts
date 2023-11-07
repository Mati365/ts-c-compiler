import type { CInterpreterContext } from './CInterpreterContext';

export interface CPreprocessorInterpretable {
  exec(interpreter: CInterpreterContext): void;
}

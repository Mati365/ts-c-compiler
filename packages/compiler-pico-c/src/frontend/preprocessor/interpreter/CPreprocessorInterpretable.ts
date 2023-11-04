import type { CPreprocessorInterpreter } from './CPreprocessorInterpreter';

export type CInterpreterContext = {
  interpreter: CPreprocessorInterpreter;
};

export interface CPreprocessorInterpretable {
  exec(interpreter: CInterpreterContext): void;
}

import type { either as E } from 'fp-ts';

export type EditorCompileLang = 'nasm' | 'c';

export type EditorStateValue = {
  lang: EditorCompileLang;
  code: string;
};

type AbstractEmulationState<S extends string, P = {}> = P & {
  state: S;
};

type EditorCompileResult = E.Either<
  unknown,
  {
    blob: Buffer;
  }
>;

export type EditorEmulationValue =
  | AbstractEmulationState<'stop'>
  | AbstractEmulationState<'compiling'>
  | AbstractEmulationState<'pause', { result: EditorCompileResult }>
  | AbstractEmulationState<'running', { result: EditorCompileResult }>;

/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import * as E from 'fp-ts/Either';

import { CompilerError } from '@ts-c-compiler/core';
import { TreePrintVisitor } from '@ts-c-compiler/grammar';

import { ASTPreprocessorNode } from './constants';
import { PreprocessorErrorCode } from './PreprocessorError';
import {
  PreprocessorInterpreter,
  PreprocessorInterpreterConfig,
} from './interpreter/PreprocessorInterpreter';

export const DEFAULT_PREPROCESSOR_CONFIG: PreprocessorInterpreterConfig = {
  grammarConfig: {
    prefixChar: '#',
  },
};

export class PreprocessorResult {
  constructor(readonly ast: ASTPreprocessorNode, readonly result: string) {}

  dump() {
    const { result, ast } = this;

    console.info(TreePrintVisitor.serializeToString(ast));
    console.info(`Preprocessor Output: \n${result}`);
  }
}

/**
 * Exec preprocessor on phrase
 */
export const preprocessor =
  (config: PreprocessorInterpreterConfig = DEFAULT_PREPROCESSOR_CONFIG) =>
  (code: string): PreprocessorResult => {
    const interpreter = new PreprocessorInterpreter(config);
    if (config.preExec) {
      interpreter.exec(config.preExec);
    }

    const [resultCode, stmt] = interpreter.exec(code);
    return new PreprocessorResult(stmt, resultCode);
  };

/**
 * Preprocessor that does not throw errors
 */
export const safeResultPreprocessor =
  (config: PreprocessorInterpreterConfig = DEFAULT_PREPROCESSOR_CONFIG) =>
  (code: string): E.Either<CompilerError[], PreprocessorResult> => {
    try {
      return E.right(preprocessor(config)(code));
    } catch (e) {
      e.code = e.code ?? PreprocessorErrorCode.GRAMMAR_SYNTAX_ERROR;

      return E.left([e]);
    }
  };

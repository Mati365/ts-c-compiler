/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import { Result, err, ok } from '@ts-c-compiler/core';
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
export function preprocessor(
  code: string,
  config: PreprocessorInterpreterConfig = DEFAULT_PREPROCESSOR_CONFIG,
): PreprocessorResult {
  const interpreter = new PreprocessorInterpreter(config);
  if (config.preExec) {
    interpreter.exec(config.preExec);
  }

  const [resultCode, stmt] = interpreter.exec(code);
  return new PreprocessorResult(stmt, resultCode);
}

/**
 * Preprocessor that does not throw errors
 */
export function safeResultPreprocessor(
  code: string,
  config: PreprocessorInterpreterConfig = DEFAULT_PREPROCESSOR_CONFIG,
): Result<PreprocessorResult, CompilerError[]> {
  try {
    return ok(preprocessor(code, config));
  } catch (e) {
    e.code = e.code ?? PreprocessorErrorCode.GRAMMAR_SYNTAX_ERROR;

    return err([e]);
  }
}

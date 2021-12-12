/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {Result, err, ok} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {TreePrintVisitor} from '@compiler/grammar/tree/TreePrintVisitor';
import {ASTPreprocessorNode} from './constants';
import {PreprocessorErrorCode} from './PreprocessorError';
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
  constructor(
    public readonly ast: ASTPreprocessorNode,
    public readonly result: string,
  ) {}

  dump() {
    const {result, ast} = this;

    console.info(TreePrintVisitor.valueOf(ast));
    console.info(`Preprocessor Output: \n${result}`);
  }
}

/**
 * Exec preprocessor on phrase
 *
 * @export
 * @param {string} code
 * @param {PreprocessorInterpreterConfig} [config=DEFAULT_PREPROCESSOR_CONFIG]
 * @returns {PreprocessorResult}
 */
export function preprocessor(
  code: string,
  config: PreprocessorInterpreterConfig = DEFAULT_PREPROCESSOR_CONFIG,
): PreprocessorResult {
  const interpreter = new PreprocessorInterpreter(config);
  if (config.preExec)
    interpreter.exec(config.preExec);

  const [resultCode, stmt] = interpreter.exec(code);
  return new PreprocessorResult(stmt, resultCode);
}

/**
 * Preprocessor that does not throw errors
 *
 * @export
 * @param {string} code
 * @param {PreprocessorInterpreterConfig} [config=DEFAULT_PREPROCESSOR_CONFIG]
 * @returns {Result<PreprocessorResult, CompilerError[]>}
 */
export function safeResultPreprocessor(
  code: string,
  config: PreprocessorInterpreterConfig = DEFAULT_PREPROCESSOR_CONFIG,
): Result<PreprocessorResult, CompilerError[]> {
  try {
    return ok(
      preprocessor(code, config),
    );
  } catch (e) {
    e.code = e.code ?? PreprocessorErrorCode.GRAMMAR_SYNTAX_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}

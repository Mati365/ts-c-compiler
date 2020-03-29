/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {Result, err, ok} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {TreePrintVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTPreprocessorStmt} from './nodes';
import {ASTPreprocessorNode} from './constants';
import {PreprocessorInterpreter} from './interpreter/PreprocessorInterpreter';

import {createPreprocessorGrammar} from './grammar';

export class PreprocessorResult {
  constructor(
    public readonly ast: ASTPreprocessorNode,
    public readonly result: string,
  ) {}
}

/**
 * Exec preprocessor on phrase
 *
 * @export
 * @param {string} str
 */
export function preprocessor(str: string): PreprocessorResult {
  const stmt: ASTPreprocessorStmt = createPreprocessorGrammar().process(str).children[0];

  const interpreter = new PreprocessorInterpreter;
  const result = interpreter.exec(stmt);

  console.info((new TreePrintVisitor).visit(stmt).reduced);
  console.info(`Preprocessor Output: \n${result}`);

  return new PreprocessorResult(
    stmt,
    result,
  );
}

/**
 * Preprocessor that does not throw errors
 *
 * @export
 * @param {string} str
 * @returns {Result<PreprocessorResult, CompilerError[]>}
 */
export function safeResultPreprocessor(str: string): Result<PreprocessorResult, CompilerError[]> {
  try {
    return ok(
      preprocessor(str),
    );
  } catch (e) {
    return err(
      [
        e,
      ],
    );
  }
}

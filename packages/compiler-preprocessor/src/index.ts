/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {TreePrintVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTPreprocessorStmt} from './nodes';
import {ASTPreprocessorNode} from './constants';
import {PreprocessorInterpreter} from './interpreter/PreprocessorInterpreter';
import {PreprocessorGrammar} from './grammar';

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
  const stmt: ASTPreprocessorStmt = PreprocessorGrammar.process(str).children[0];

  const interpreter = new PreprocessorInterpreter;
  const result = interpreter.exec(stmt);

  return new PreprocessorResult(
    stmt,
    result,
  );
}

const {ast, result} = preprocessor(`
  %macro test_macro 2
    mov ax, $0
    mov bx, $1
  %endmacro

  test_macro ax, bx
`);

console.info((new TreePrintVisitor).visit(ast).reduced);
console.info(`Output: \n${result}`);

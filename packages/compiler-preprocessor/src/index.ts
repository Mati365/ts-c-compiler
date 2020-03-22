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
  %if 3+2*5 > 5 && (5 * 5 < 9 || 5 * 5 > 1)
    xor bx, cx
  %endif

  %define test_define(arg1,brg2,c) arg1
  %define test_define2 abce
  %macro dupa 3
    %macro test_abc 4
      xor ax, bx
      mov bx, [bx:cx+5]
    %endmacro

    %define test_define(arg1,brg2,c) ax
    %define test_define2 abce
  %endmacro

  xor ax, test_define(2*(5-6), 3, 4)
  times 55 db (2+2)
`);

console.info((new TreePrintVisitor).visit(ast).reduced);
console.info(`Output: \n${result}`);

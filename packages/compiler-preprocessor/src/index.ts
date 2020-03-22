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
%define abc(a) mov a,
%macro dupa 2
mov ax, %1
mov bx, %2
%endmacro
%macro dupa 1
mov ax, %1
%endmacro

abc(ax) bx
dupa 2, ax
dupa ax
`);

console.info((new TreePrintVisitor).visit(ast).reduced);
console.info(`Output: \n${result}`);

import * as R from 'ramda';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

/**
 * @example
 * %ifdef TEST
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 *
 * @export
 * @class ASTPreprocessorIFDef
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorIFDef extends ASTPreprocessorNode {
  private _result: boolean = false;

  constructor(
    loc: NodeLocation,
    public readonly itemName: string,
    public readonly consequent: ASTPreprocessorNode,
    public readonly alternate: ASTPreprocessorNode = null,
  ) {
    super(ASTPreprocessorKind.IfDefStmt, loc);
  }

  toEmitterLine(): string {
    const {_result, consequent, alternate} = this;

    if (_result)
      return consequent.toEmitterLine();

    return alternate?.toEmitterLine() ?? '';
  }

  /**
   * Exec interpreter on node
   *
   * @param {PreprocessorInterpreter} interpreter
   * @returns {InterpreterResult}
   * @memberof ASTPreprocessorMacro
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const {consequent, alternate, itemName} = this;
    const result = !R.isNil(interpreter.getVariable(itemName)) || interpreter.getCallables(itemName)?.length > 0;

    this._result = result;
    if (result)
      return consequent.exec(interpreter);

    return alternate?.exec(interpreter);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof BinaryNode
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {consequent, alternate} = this;

    super.walk(visitor);

    if (consequent)
      visitor.visit(consequent);

    if (alternate)
      visitor.visit(alternate);
  }
}

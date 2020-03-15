import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

/**
 * @example
 * %macro dupa 1
 *  xor eax, eax
 * %endmacro
 *
 * @export
 * @class ASTPreprocessorMacro
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorMacro extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly argsCount: number,
    children: ASTPreprocessorNode[],
  ) {
    super(ASTPreprocessorKind.MacroStmt, loc, children);
  }

  toString(): string {
    const {name, argsCount} = this;

    return `${super.toString()} name=${name} args=${argsCount}`;
  }
}

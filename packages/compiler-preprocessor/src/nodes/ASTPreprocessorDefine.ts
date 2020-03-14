import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';

export class ASTPreprocessorDefineArgSchema {
  constructor(
    public readonly name: string,
  ) {}
}

/**
 * @example
 *  %define param(a, b) ((a)+(b)*4)
 *
 * @export
 * @class ASTPreprocessorDefine
 * @extends {TreeNode}
 */
export class ASTPreprocessorDefine extends TreeNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly argsSchema: ASTPreprocessorDefineArgSchema[] = [],
    public readonly expression: Token[],
  ) {
    super(loc);
  }
}

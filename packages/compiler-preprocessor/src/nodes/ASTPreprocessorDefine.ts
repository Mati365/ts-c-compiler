import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

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
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorDefine extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly argsSchema: ASTPreprocessorDefineArgSchema[] = [],
    public readonly expression: Token[],
  ) {
    super(ASTPreprocessorKind.DefineStmt, loc);
  }
}

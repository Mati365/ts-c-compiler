import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCConstantExpression} from './ASTCConstantExpression';

/**
 * Node that holds single enum item such as RED = 'blue'
 *
 * @export
 * @class ASTCEnumEnumeration
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'expression',
    ],
  },
)
export class ASTCEnumEnumeration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: Token<string>,
    public readonly expression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.EnumItem, loc);
  }

  /**
   * @returns
   * @memberof ASTCEnumEnumeration
   */
  toString() {
    const {kind, name} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        name,
      },
    );
  }
}

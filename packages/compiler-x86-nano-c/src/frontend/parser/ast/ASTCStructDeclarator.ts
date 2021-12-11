import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCDeclarator} from './ASTCDeclarator';
import {ASTCConstantExpression} from './ASTCConstantExpression';

@walkOverFields(
  {
    fields: [
      'declarator',
      'expression',
    ],
  },
)
export class ASTCStructDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly declarator: ASTCDeclarator,
    public readonly expression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.StructDeclaratorList, loc);
  }
}

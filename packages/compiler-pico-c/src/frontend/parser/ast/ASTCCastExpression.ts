import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCTypeName } from './ASTCTypeName';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['typeName', 'expression'],
})
export class ASTCCastExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly typeName?: ASTCTypeName,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.CastExpression, loc);
  }
}

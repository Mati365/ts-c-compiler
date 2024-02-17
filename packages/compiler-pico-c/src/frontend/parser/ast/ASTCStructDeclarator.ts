import { walkOverFields } from '@ts-cc/grammar';

import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDeclarator } from './ASTCDeclarator';
import { ASTCConstantExpression } from './ASTCConstantExpression';

@walkOverFields({
  fields: ['declarator', 'expression'],
})
export class ASTCStructDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly declarator: ASTCDeclarator,
    readonly expression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.StructDeclarator, loc);
  }
}

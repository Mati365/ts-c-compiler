import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
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

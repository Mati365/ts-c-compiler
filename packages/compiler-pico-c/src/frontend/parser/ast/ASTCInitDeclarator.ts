import { walkOverFields } from '@ts-cc/grammar';

import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDeclarator } from './ASTCDeclarator';
import { ASTCInitializer } from './ASTCInitializer';

@walkOverFields({
  fields: ['declarator', 'initializer'],
})
export class ASTCInitDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly declarator: ASTCDeclarator,
    readonly initializer: ASTCInitializer,
  ) {
    super(ASTCCompilerKind.InitDeclarator, loc);
  }
}

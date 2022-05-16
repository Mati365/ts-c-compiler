import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCDeclarator} from './ASTCDeclarator';
import {ASTCInitializer} from './ASTCInitializer';

/**
 * @export
 * @class ASTCEnumSpecifier
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'declarator',
      'initializer',
    ],
  },
)
export class ASTCInitDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly declarator: ASTCDeclarator,
    readonly initializer: ASTCInitializer,
  ) {
    super(ASTCCompilerKind.InitDeclarator, loc);
  }
}

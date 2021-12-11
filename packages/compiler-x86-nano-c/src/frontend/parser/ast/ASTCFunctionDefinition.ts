import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCDeclarationSpecifier} from './ASTCDeclarationSpecifier';
import {ASTCDeclarator} from './ASTCDeclarator';
import {ASTCBlockItemsList} from './ASTCBlockItemsList';
import {ASTCDeclarationsList} from './ASTCDeclarationsList';

/**
 * int main() {}
 *
 * @export
 * @class ASTCFunctionDefinition
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'specifier',
      'declarator',
      'declarationsList',
      'content',
    ],
  },
)
export class ASTCFunctionDefinition extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly specifier: ASTCDeclarationSpecifier,
    public readonly declarator: ASTCDeclarator,
    public readonly declarationsList: ASTCDeclarationsList,
    public readonly content: ASTCBlockItemsList,
  ) {
    super(ASTCCompilerKind.FunctionDefinition, loc);
  }
}

import { walkOverFields } from '@ts-cc/grammar';

import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDeclarationSpecifier } from './ASTCDeclarationSpecifier';
import { ASTCDeclarator } from './ASTCDeclarator';
import { ASTCBlockItemsList } from './ASTCBlockItemsList';
import { ASTCDeclarationsList } from './ASTCDeclarationsList';
import { CScopeTree } from '../../analyze';
import { IsNewScopeASTNode } from '../../analyze/interfaces';

/**
 * int main() {}
 */
@walkOverFields({
  fields: ['specifier', 'declarator', 'declarationsList', 'content'],
})
export class ASTCFunctionDefinition
  extends ASTCCompilerNode
  implements IsNewScopeASTNode
{
  scope?: CScopeTree;

  constructor(
    loc: NodeLocation,
    readonly specifier: ASTCDeclarationSpecifier,
    readonly declarator: ASTCDeclarator,
    readonly declarationsList: ASTCDeclarationsList,
    readonly content: ASTCBlockItemsList,
  ) {
    super(ASTCCompilerKind.FunctionDefinition, loc);
  }
}

import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { CScopeTree } from '../../analyze';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { IsNewScopeASTNode } from '../../analyze/interfaces';

@walkOverFields({
  fields: ['declaration', 'condition', 'expression', 'statement'],
})
export class ASTCForStatement
  extends ASTCCompilerNode
  implements IsNewScopeASTNode
{
  scope?: CScopeTree;

  constructor(
    loc: NodeLocation,
    readonly statement: ASTCCompilerNode,
    readonly declaration: ASTCCompilerNode,
    readonly condition?: ASTCCompilerNode,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ForStmt, loc);
  }
}

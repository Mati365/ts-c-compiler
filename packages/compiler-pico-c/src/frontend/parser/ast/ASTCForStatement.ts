import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { CScopeTree } from '../../analyze';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { IsNewScopeASTNode } from '../../analyze/interfaces';

@walkOverFields({
  fields: ['declaration', 'condition', 'expression', 'statement'],
})
export class ASTCForStatement extends ASTCCompilerNode implements IsNewScopeASTNode {
  scope?: CScopeTree;

  constructor(
    loc: NodeLocation,
    public statement: ASTCCompilerNode,
    readonly declaration: ASTCCompilerNode,
    readonly condition?: ASTCCompilerNode,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ForStmt, loc);
  }
}

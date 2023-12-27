import * as R from 'ramda';

import { walkOverFields } from '@ts-c-compiler/grammar';
import { IsEmpty } from '@ts-c-compiler/core';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { IsNewScopeASTNode } from 'frontend/analyze/interfaces';
import { CScopeTree } from 'frontend/analyze';

import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCExpressionStatement } from './ASTCExpressionStatement';

@walkOverFields({
  fields: ['list', 'expressionStmt'],
})
export class ASTCCompoundExpressionStmt
  extends ASTCCompilerNode
  implements IsEmpty, IsNewScopeASTNode
{
  scope?: CScopeTree;

  constructor(
    loc: NodeLocation,
    children: ASTCCompilerNode[],
    readonly expressionStmt: ASTCExpressionStatement,
  ) {
    super(ASTCCompilerKind.CompoundExpressionStmt, loc, children);
  }

  isEmpty() {
    return R.isEmpty(this.children);
  }
}

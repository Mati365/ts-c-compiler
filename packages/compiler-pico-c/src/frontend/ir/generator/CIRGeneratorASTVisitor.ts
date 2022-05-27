import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';

import {CFunctionDeclType, CScopeTree} from '../../analyze';
import {ASTCCompilerNode} from '../../parser';
import type {CIRGeneratorScopeVisitor} from './CIRGeneratorScopeVisitor';

export type CIRGeneratorASTContext = {
  fnType: CFunctionDeclType;
  generator: CIRGeneratorScopeVisitor;
  scope: CScopeTree;
};

export class CIRGeneratorASTVisitor extends GroupTreeVisitor<ASTCCompilerNode, any, CIRGeneratorASTContext> {
  private scope: CScopeTree;

  constructor(initialScope: CScopeTree) {
    super();

    this.scope = initialScope;
    this.setVisitorsMap(
      {

      },
    );
  }
}

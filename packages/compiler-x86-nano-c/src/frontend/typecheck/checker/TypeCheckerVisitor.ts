import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode} from '../../parser/ast/ASTCCompilerNode';
import {TypeCheckScopeTree} from './TypeCheckScopeTree';
import {C_TYPES_VISITORS} from './visitors';

export class TypeCheckerVisitor extends GroupTreeVisitor<ASTCCompilerNode> {
  private globalScope = new TypeCheckScopeTree;

  constructor() {
    super(C_TYPES_VISITORS);
  }

  getGlobalScope() { return this.globalScope; }
}

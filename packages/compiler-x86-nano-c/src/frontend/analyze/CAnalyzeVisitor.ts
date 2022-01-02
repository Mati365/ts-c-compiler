import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeCheckConfig} from './constants';
import {ASTCCompilerNode} from '../parser/ast/ASTCCompilerNode';
import {CAnalyzeContext} from './CAnalyzeContext';
import {CScopeTree} from './scope/CScopeTree';
import {C_TYPES_VISITORS} from './ast/type-extractor-visitors';

type CAnalyzeVisitorAttrs = CTypeCheckConfig & {
  scope?: CScopeTree,
};

/**
 * Root typechecker visitor
 *
 * @export
 * @class CAnalyzeVisitor
 * @extends {GroupTreeVisitor<ASTCCompilerNode, any, CAnalyzeContext>}
 */
export class CAnalyzeVisitor extends GroupTreeVisitor<ASTCCompilerNode, any, CAnalyzeContext> {
  constructor({scope, ...config}: CAnalyzeVisitorAttrs) {
    super(C_TYPES_VISITORS);
    this.setContext(
      {
        scope: scope ?? new CScopeTree,
        config,
      },
    );
  }

  get scope() { return this.context.scope; }

  ofScope(scope: CScopeTree) {
    const {context} = this;

    return new CAnalyzeVisitor(
      {
        ...context.config,
        scope,
      },
    );
  }

  visitAndAppendScope(node: ASTCCompilerNode) {
    const childScope = this.scope.createChildScope();
    this
      .ofScope(childScope)
      .visit(node);

    return childScope;
  }
}

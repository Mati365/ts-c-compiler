import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeCheckConfig} from '../constants';
import {ASTCCompilerNode} from '../../parser/ast/ASTCCompilerNode';
import {TypeCheckerContext} from './TypeCheckerContext';
import {TypeCheckScopeTree} from './scope/TypeCheckScopeTree';
import {C_TYPES_VISITORS} from './ast-visitors';

type TypeCheckerVisitorAttrs = CTypeCheckConfig & {
  scope?: TypeCheckScopeTree,
};

/**
 * Root typechecker visitor
 *
 * @export
 * @class TypeCheckerVisitor
 * @extends {GroupTreeVisitor<ASTCCompilerNode, any, TypeCheckerContext>}
 */
export class TypeCheckerVisitor extends GroupTreeVisitor<ASTCCompilerNode, any, TypeCheckerContext> {
  constructor({scope, ...config}: TypeCheckerVisitorAttrs) {
    super(C_TYPES_VISITORS);
    this.setContext(
      {
        scope: scope ?? new TypeCheckScopeTree,
        config,
      },
    );
  }

  get scope() { return this.context.scope; }

  ofScope(scope: TypeCheckScopeTree) {
    const {context} = this;

    return new TypeCheckerVisitor(
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

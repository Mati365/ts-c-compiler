import * as R from 'ramda';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeCheckConfig} from '../constants';
import {ASTCCompilerNode} from '../../parser/ast/ASTCCompilerNode';
import {CTypeAnalyzeContext} from './CTypeAnalyzeContext';
import {CScopeTree} from '../scope/CScopeTree';
import {ASTC_TYPE_CREATORS} from './type-assign-visitor';

type CTypeAnalyzeVisitorAttrs = CTypeCheckConfig & {
  scope?: CScopeTree,
  currentAnalyzed?: CTypeAnalyzeContext['currentAnalyzed'],
};

/**
 * Root typechecker visitor
 *
 * @export
 * @class CTypeAnalyzeVisitor
 * @extends {GroupTreeVisitor<ASTCCompilerNode, any, CTypeAnalyzeContext>}
 */
export class CTypeAnalyzeVisitor extends GroupTreeVisitor<ASTCCompilerNode, any, CTypeAnalyzeContext> {
  constructor(
    {
      scope,
      currentAnalyzed,
      ...config
    }: CTypeAnalyzeVisitorAttrs,
  ) {
    super();

    this.setVisitorsMap(
      R.reduce(
        (acc, ItemClass) => {
          const obj = new ItemClass(this);
          acc[obj.kind] = obj;

          return acc;
        },
        {} as TreeVisitorsMap<ASTCCompilerNode>,
        ASTC_TYPE_CREATORS,
      ),
    );

    this.setContext(
      {
        config,
        scope: scope ?? new CScopeTree,
        currentAnalyzed: currentAnalyzed ?? {
          fnNode: null,
        },
      },
    );
  }

  get scope() { return this.context.scope; }
  get arch() { return this.context.config.arch; }
  get currentAnalyzed() { return this.context.currentAnalyzed; }

  ofScope(scope: CScopeTree) {
    const {context, currentAnalyzed} = this;

    return new CTypeAnalyzeVisitor(
      {
        ...context.config,
        currentAnalyzed,
        scope,
      },
    );
  }

  initializeScopeAndWalkTo<C extends ASTCCompilerNode>(scope: CScopeTree, node: C): C {
    scope.setParentScope(this.scope);
    this
      .ofScope(scope)
      .visit(node);

    return node;
  }
}

import * as R from 'ramda';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeCheckConfig} from '../constants';
import {ASTCCompilerNode} from '../../parser/ast/ASTCCompilerNode';
import {CTypeAnalyzeContext} from './CTypeAnalyzeContext';
import {CScopeTree} from '../scope/CScopeTree';
import {ASTC_TYPE_CREATORS} from './ast-kinds-visitors';

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
        scope: scope ?? new CScopeTree(config),
        currentAnalyzed: currentAnalyzed ?? {
          fnType: null,
        },
      },
    );
  }

  get scope() { return this.context.scope; }
  get arch() { return this.context.config.arch; }
  get currentAnalyzed() { return this.context.currentAnalyzed; }

  visit(node?: ASTCCompilerNode<any>): this {
    super.visit(node ?? this.scope.parentAST);
    return this;
  }

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

  ofBlockScope(node?: ASTCCompilerNode) {
    const {scope, context} = this;

    return this.ofScope(
      scope.appendScope(new CScopeTree(context.config, node)),
    );
  }
}

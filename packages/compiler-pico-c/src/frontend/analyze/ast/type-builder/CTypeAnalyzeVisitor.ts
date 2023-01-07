import * as R from 'ramda';

import { TreeVisitorsMap } from '@compiler/grammar/tree/TreeGroupedVisitor';

import { ASTC_TYPE_CREATORS } from './creators';
import { ASTCCompilerNode } from '../../../parser/ast/ASTCCompilerNode';
import { IsNewScopeASTNode } from '../../interfaces';

import { CTypeCheckConfig } from '../../constants';
import { CTypeAnalyzeContext } from './CTypeAnalyzeContext';
import { CScopeTree } from '../../scope/CScopeTree';
import { CInnerTypeTreeVisitor } from './CInnerTypeTreeVisitor';

type CTypeAnalyzeVisitorAttrs = CTypeCheckConfig & {
  scope?: CScopeTree;
  currentAnalyzed?: CTypeAnalyzeContext['currentAnalyzed'];
};

/**
 * Root typechecker visitor
 */
export class CTypeAnalyzeVisitor extends CInnerTypeTreeVisitor {
  constructor({ scope, currentAnalyzed, ...config }: CTypeAnalyzeVisitorAttrs) {
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

    this.setContext({
      config,
      scope: scope ?? new CScopeTree(config),
      currentAnalyzed: currentAnalyzed ?? {
        fnType: null,
      },
    });
  }

  get scope() {
    return this.context.scope;
  }
  get arch() {
    return this.context.config.arch;
  }
  get currentAnalyzed() {
    return this.context.currentAnalyzed;
  }

  /**
   * Creates new scope visitor
   */
  ofScopeVisitor(scope: CScopeTree): CTypeAnalyzeVisitor {
    const { context, currentAnalyzed } = this;

    return new CTypeAnalyzeVisitor({
      ...context.config,
      currentAnalyzed,
      scope,
    });
  }

  /**
   * Creates new scope and executes fn
   */
  enterScope(
    node: ASTCCompilerNode,
    fn: (newScope: CTypeAnalyzeVisitor) => void,
  ) {
    const { scope, context } = this;

    const newScope = new CScopeTree(context.config, node);
    const visitor = this.ofScopeVisitor(scope.appendScope(newScope));

    (<IsNewScopeASTNode>node).scope = newScope;
    fn(visitor);
  }

  /**
   * Creates scope and enters node
   */
  visitBlockScope(node?: ASTCCompilerNode) {
    this.enterScope(node, visitor => visitor.visit(node));
  }
}

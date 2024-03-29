import * as E from 'fp-ts/Either';

import { createBuiltinAnalyzeScope } from 'builtins';

import { CTypeCheckError, CTypeCheckErrorCode } from './errors/CTypeCheckError';
import { CTypeCheckConfig } from './constants';
import { ASTCTreeNode } from '../parser/ast';
import { CTypeAnalyzeVisitor } from './ast';
import { CScopeTree } from './scope';
// import { serializeTypedTreeToString } from 'frontend/parser';

export type ScopeTreeBuilderResult = {
  scope: CScopeTree;
  tree: ASTCTreeNode;
};

/**
 * Returns result monad from tree assign
 */
export const safeBuildTypedTree =
  (config: CTypeCheckConfig) =>
  (tree: ASTCTreeNode): E.Either<CTypeCheckError[], ScopeTreeBuilderResult> => {
    try {
      const analyzer = new CTypeAnalyzeVisitor({
        ...config,
        scope: createBuiltinAnalyzeScope(config.arch),
      });

      const { scope } = analyzer.visit(tree);
      // console.info(serializeTypedTreeToString(tree));

      return E.right({
        scope,
        tree,
      });
    } catch (e) {
      e.code = e.code ?? CTypeCheckErrorCode.TYPECHECK_ERROR;
      e.tree = tree;

      return E.left([e]);
    }
  };

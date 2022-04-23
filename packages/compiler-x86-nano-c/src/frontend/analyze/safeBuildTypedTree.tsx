import {Result, ok, err} from '@compiler/core/monads/Result';
import {CTypeCheckError, CTypeCheckErrorCode} from './errors/CTypeCheckError';
import {CTypeCheckConfig} from './constants';
import {ASTCTreeNode} from '../parser/ast';
import {CTypeAnalyzeVisitor} from './ast';
import {CScopeTree} from './scope';

type ScopeTreeBuilderResult = {
  scope: CScopeTree,
  tree: ASTCTreeNode,
};

/**
 * Returns result monad from tree assign
 *
 * @export
 * @param {CTypeCheckConfig} config
 * @param {ASTCTreeNode} tree
 * @return {Result<ASTCTreeNode, CTypeCheckError[]>}
 */
export function safeBuildTypedTree(
  config: CTypeCheckConfig,
  tree: ASTCTreeNode,
): Result<ScopeTreeBuilderResult, CTypeCheckError[]> {
  try {
    const {scope} = new CTypeAnalyzeVisitor(config).visit(tree);

    return ok(
      {
        scope,
        tree,
      },
    );
  } catch (e) {
    e.code = e.code ?? CTypeCheckErrorCode.TYPECHECK_ERROR;
    e.tree = tree;

    return err(
      [
        e,
      ],
    );
  }
}

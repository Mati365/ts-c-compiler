import {Result, ok, err} from '@compiler/core/monads/Result';
import {CTypeCheckError, CTypeCheckErrorCode} from './errors/CTypeCheckError';
import {CTypeCheckConfig} from './constants';
import {ASTCTreeNode} from '../parser/ast';
import {TypeCheckerVisitor} from './type-checker/TypeCheckerVisitor';
import {TypeCheckScopeTree} from './type-checker';

type ScopeTreeBuilderResult = {
  scope: TypeCheckScopeTree,
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
    const {scope} = new TypeCheckerVisitor(config).visit(tree);

    return ok(
      {
        scope,
        tree,
      },
    );
  } catch (e) {
    e.code = e.code ?? CTypeCheckErrorCode.TYPECHECK_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}

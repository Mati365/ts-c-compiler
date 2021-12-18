import {Result, ok, err} from '@compiler/core/monads/Result';
import {CTypeCheckError, CTypeCheckErrorCode} from './errors/CTypeCheckError';
import {CTypeCheckConfig} from './constants';
import {ASTCTreeNode} from '../parser/ast';
import {TypeCheckerVisitor} from './checker/TypeCheckerVisitor';

/**
 * Returns result monad from tree assign
 *
 * @export
 * @param {CTypeCheckConfig} config
 * @param {ASTCTreeNode} tree
 * @return {Result<ASTCTreeNode, CTypeCheckError[]>}
 */
export function safeAssignTypesToTree(
  config: CTypeCheckConfig,
  tree: ASTCTreeNode,
): Result<ASTCTreeNode, CTypeCheckError[]> {
  try {
    new TypeCheckerVisitor(config).visit(tree);
    return ok(tree);
  } catch (e) {
    e.code = e.code ?? CTypeCheckErrorCode.TYPECHECK_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}

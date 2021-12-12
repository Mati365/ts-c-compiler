import {Result, ok, err} from '@compiler/core/monads/Result';
import {CTypeCheckError, CTypeCheckErrorCode} from './errors/CTypeCheckError';
import {ASTCTreeNode} from '../parser/ast';
import {TypeCheckerVisitor} from './checker/TypeCheckerVisitor';

/**
 * Returns result monad from tree assign
 *
 * @export
 * @param {ASTCTreeNode} tree
 * @return {Result<ASTCTreeNode, CTypeCheckError[]>}
 */
export function safeAssignTypesToTree(tree: ASTCTreeNode): Result<ASTCTreeNode, CTypeCheckError[]> {
  try {
    new TypeCheckerVisitor().visit(tree);
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

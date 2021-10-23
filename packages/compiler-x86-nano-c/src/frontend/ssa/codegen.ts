import {Result, ok, err} from '@compiler/core/monads/Result';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {SSACodegenError, SSACodegenErrorCode} from './SAACodegenError';

type SSAGeneratorResult = {
  tree: TreeNode,
};

/**
 * Safe transform AST tree into unoptimized SSA form
 *
 * @export
 * @param {TreeNode} tree
 * @return {SSAGeneratorResult}
 */
export function ssaCodegen(tree: TreeNode): SSAGeneratorResult {
  console.info(tree);

  return {
    tree,
  };
}

/**
 * SSA Generator that does not throw errors
 *
 * @export
 * @param {TreeNode} tree
 * @return {Result<SSAGeneratorResult, SSACodegenError[]>}
 */
export function safeSAACodegen(tree: TreeNode): Result<SSAGeneratorResult, SSACodegenError[]> {
  try {
    return ok(
      ssaCodegen(tree),
    );
  } catch (e) {
    e.code = e.code ?? SSACodegenErrorCode.UNKNOWN_INSTRUCTION;

    return err(
      [
        e,
      ],
    );
  }
}

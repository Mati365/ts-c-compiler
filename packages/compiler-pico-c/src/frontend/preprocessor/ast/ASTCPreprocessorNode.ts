import { TreeNode } from '@ts-c-compiler/grammar';

export enum ASTCPreprocessorKind {
  Define = 'Define',
}

export type ASTCPreprocessorTreeNode = TreeNode<ASTCPreprocessorKind>;

export class ASTCPreprocessorNode<
  C extends TreeNode<ASTCPreprocessorKind> = any,
> extends TreeNode<ASTCPreprocessorKind, C> {}

export function isPreprocessorTreeNode(
  node: any,
): node is ASTCPreprocessorNode {
  return node instanceof ASTCPreprocessorNode;
}

import { TreeNode } from '@ts-c-compiler/grammar';
import type {
  CPreprocessorInterpretable,
  CInterpreterContext,
} from '../interpreter';

export enum ASTCPreprocessorKind {
  CodeBlock = 'CodeBlock',
  IfDef = 'IfDef',
  IfNotDef = 'IfNotDef',
  Define = 'Define',
  Stmt = 'Stmt',
}

export class ASTCPreprocessorTreeNode<
    C extends TreeNode<ASTCPreprocessorKind> = any,
  >
  extends TreeNode<ASTCPreprocessorKind, C>
  implements CPreprocessorInterpretable
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exec(ctx: CInterpreterContext): void {
    return null;
  }
}

export function isPreprocessorTreeNode(
  node: any,
): node is ASTCPreprocessorTreeNode {
  return node instanceof ASTCPreprocessorTreeNode;
}

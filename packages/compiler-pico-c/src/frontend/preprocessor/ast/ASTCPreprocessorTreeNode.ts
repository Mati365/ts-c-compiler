import { TreeNode } from '@ts-c-compiler/grammar';
import type {
  CPreprocessorInterpretable,
  CInterpreterContext,
} from '../interpreter';

export type ASTCExecResult = number | string | boolean | void;

export enum ASTCPreprocessorKind {
  CodeBlock = 'CodeBlock',
  Expression = 'Expression',
  BinaryOperator = 'BinaryOperator',
  If = 'If',
  Elif = 'Elif',
  IfDef = 'IfDef',
  IfNotDef = 'IfNotDef',
  Define = 'Define',
  Stmt = 'Stmt',
  Value = 'Value',
}

export class ASTCPreprocessorTreeNode<
    C extends TreeNode<ASTCPreprocessorKind> = any,
  >
  extends TreeNode<ASTCPreprocessorKind, C>
  implements CPreprocessorInterpretable
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exec(ctx: CInterpreterContext): ASTCExecResult {
    return null;
  }
}

export function isPreprocessorTreeNode(
  node: any,
): node is ASTCPreprocessorTreeNode {
  return node instanceof ASTCPreprocessorTreeNode;
}

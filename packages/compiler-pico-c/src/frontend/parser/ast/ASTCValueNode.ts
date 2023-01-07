import { ValueNode } from '@compiler/grammar/tree/TreeNode';
import { Token } from '@compiler/lexer/tokens';
import { ASTCCompilerKind } from './ASTCCompilerNode';

/**
 * Holds constant numeric values
 */
export class ASTCValueNode<T extends Token[] = any> extends ValueNode<
  T,
  ASTCCompilerKind
> {}

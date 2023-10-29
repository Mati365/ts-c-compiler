import { ValueNode } from '@ts-c/grammar';
import { Token } from '@ts-c/lexer';
import { ASTCCompilerKind } from './ASTCCompilerNode';

/**
 * Holds constant numeric values
 */
export class ASTCValueNode<T extends Token[] = any> extends ValueNode<
  T,
  ASTCCompilerKind
> {}

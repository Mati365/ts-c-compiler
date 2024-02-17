import { ValueNode } from '@ts-cc/grammar';
import { Token } from '@ts-cc/lexer';
import { ASTCCompilerKind } from './ASTCCompilerNode';

/**
 * Holds constant numeric values
 */
export class ASTCValueNode<T extends Token[] = any> extends ValueNode<
  T,
  ASTCCompilerKind
> {}

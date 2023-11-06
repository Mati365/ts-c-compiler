import { rpn } from '@ts-c-compiler/rpn';

import { Token, NumberToken } from '@ts-c-compiler/lexer';
import { ValueNode, type NodeLocation } from '@ts-c-compiler/grammar';

import type {
  CInterpreterContext,
  CPreprocessorInterpretable,
} from '../interpreter';

import {
  ASTCPreprocessorKind,
  type ASTCExecResult,
} from './ASTCPreprocessorTreeNode';

import {
  CPreprocessorError,
  CPreprocessorErrorCode,
} from '../grammar/CPreprocessorError';

/**
 * Numbers and simple macros expressions
 */
export class ASTCValueNode<T extends Token[] = any>
  extends ValueNode<T, ASTCPreprocessorKind>
  implements CPreprocessorInterpretable
{
  constructor(loc: NodeLocation, readonly value: T) {
    super(ASTCPreprocessorKind.Value, loc, null);
  }

  exec({ evalTokens }: CInterpreterContext): ASTCExecResult {
    const resultTokens = evalTokens(this.value);
    const [token] = resultTokens;

    if (token instanceof NumberToken) {
      return token.value.number;
    }

    // handle string, keyword tokens usually emited from macros
    const parsed = rpn(token.text);
    if (Number.isNaN(parsed)) {
      throw new CPreprocessorError(
        CPreprocessorErrorCode.INCORRECT_VALUE_EXPRESSION,
        token.loc,
      );
    }

    return +parsed;
  }
}

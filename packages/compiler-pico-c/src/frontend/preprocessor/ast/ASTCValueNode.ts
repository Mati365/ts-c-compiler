import { pipe } from 'fp-ts/function';
import { rpn } from '@ts-c-compiler/rpn';

import { Token, joinTokensWithSpaces } from '@ts-c-compiler/lexer';
import { ValueNode, type NodeLocation } from '@ts-c-compiler/grammar';

import type { CInterpreterContext, CPreprocessorInterpretable } from '../interpreter';

import { ASTCPreprocessorKind, type ASTCExecResult } from './ASTCPreprocessorTreeNode';

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
  constructor(
    loc: NodeLocation,
    readonly value: T,
  ) {
    super(ASTCPreprocessorKind.Value, loc, null);
  }

  exec({ evalTokens }: CInterpreterContext): ASTCExecResult {
    const parsed = pipe(this.value, evalTokens, joinTokensWithSpaces, rpn);

    if (Number.isNaN(parsed)) {
      throw new CPreprocessorError(
        CPreprocessorErrorCode.INCORRECT_VALUE_EXPRESSION,
        this.loc.start,
      );
    }

    return +parsed;
  }
}

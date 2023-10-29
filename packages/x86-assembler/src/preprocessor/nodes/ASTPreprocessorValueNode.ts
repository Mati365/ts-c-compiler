import { rpn } from '@ts-c-compiler/rpn';
import { joinTokensTexts } from '@ts-c-compiler/lexer';

import { Token, NumberToken } from '@ts-c-compiler/lexer';
import { ValueNode } from '@ts-c-compiler/grammar';
import {
  InterpreterResult,
  PreprocessorInterpreter,
  PreprocessorInterpretable,
} from '../interpreter/PreprocessorInterpreter';

import { ASTPreprocessorKind } from '../constants';
import { PreprocessorError, PreprocessorErrorCode } from '../PreprocessorError';

/**
 * Numbers and simple macros expressions
 */
export class ASTPreprocessorValueNode<T extends Token[] = any>
  extends ValueNode<T, ASTPreprocessorKind>
  implements PreprocessorInterpretable
{
  toEmitterLine(): string {
    return '';
  }

  toString(): string {
    const { value, kind } = this;

    return `${kind} value=${joinTokensTexts('', value)}`;
  }

  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const { value } = this;
    const [, resultTokens] = interpreter.removeMacrosFromTokens(value);
    const { loc } = resultTokens[0];

    if (resultTokens.length !== 1) {
      throw new PreprocessorError(
        PreprocessorErrorCode.INCORRECT_VALUE_EXPRESSION,
        loc,
      );
    }

    const [token] = resultTokens;
    if (token instanceof NumberToken) {
      return token.value.number;
    }

    // handle string, keyword tokens usually emited from macros
    const parsed = rpn(token.text);
    if (Number.isNaN(parsed)) {
      throw new PreprocessorError(
        PreprocessorErrorCode.INCORRECT_VALUE_EXPRESSION,
        loc,
      );
    }

    return +parsed;
  }
}

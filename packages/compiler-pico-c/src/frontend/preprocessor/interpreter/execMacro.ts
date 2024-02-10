import { Token, TokenType } from '@ts-c-compiler/lexer';
import { CPreprocessorMacro, CPreprocessorMacroArgTokens } from './types';

export const execMacro =
  (callArgs: CPreprocessorMacroArgTokens[]) =>
  (macro: CPreprocessorMacro): Token[] => {
    if (!callArgs.length) {
      return macro.expression;
    }

    let expression = [...macro.expression];
    let callArgIndex = 0;

    for (let defArgIndex = 0; defArgIndex < macro.args.length; ++defArgIndex) {
      const argDef = macro.args[defArgIndex];

      for (let exprTokenIndex = 0; exprTokenIndex < expression.length; ++exprTokenIndex) {
        if (expression[exprTokenIndex]?.text !== argDef.name) {
          continue;
        }

        // handle "..." variadic macros
        if (argDef.va) {
          let vaArgs: Token[] = [];

          for (; callArgIndex < callArgs.length; ++callArgIndex) {
            vaArgs.push(...callArgs[callArgIndex]);

            if (callArgIndex + 1 < callArgs.length) {
              vaArgs.push(
                new Token(TokenType.COMMA, null, null, callArgs[callArgIndex][0].loc),
              );
            }
          }

          --callArgIndex;
          expression = [
            ...expression.slice(0, exprTokenIndex),
            ...vaArgs,
            ...expression.slice(exprTokenIndex + 1),
          ];
        } else {
          expression = [
            ...expression.slice(0, exprTokenIndex),
            ...callArgs[callArgIndex],
            ...expression.slice(exprTokenIndex + 1),
          ];
        }
      }

      callArgIndex++;
    }

    return expression;
  };

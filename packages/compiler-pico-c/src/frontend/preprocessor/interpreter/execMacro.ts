import { Token } from '@ts-c-compiler/lexer';
import { CPreprocessorMacro, CPreprocessorMacroArgTokens } from './types';

export const execMacro =
  (args: CPreprocessorMacroArgTokens[]) =>
  (macro: CPreprocessorMacro): Token[] => {
    if (!args.length) {
      return macro.expression;
    }

    let expression = [...macro.expression];

    for (let argIndex = 0; argIndex < macro.args.length; ++argIndex) {
      const arg = {
        name: macro.args[argIndex],
        value: args[argIndex],
      };

      for (let tokenIndex = 0; tokenIndex < expression.length; ++tokenIndex) {
        if (expression[tokenIndex]?.text === arg.name) {
          expression = [
            ...expression.slice(0, tokenIndex),
            ...arg.value,
            ...expression.slice(tokenIndex + 1),
          ];
        }
      }
    }

    return expression;
  };

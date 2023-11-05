import { Token } from '@ts-c-compiler/lexer';
import { CPreprocessorMacro, CPreprocessorMacroArgToken } from './types';

export const execMacro =
  (args: CPreprocessorMacroArgToken[]) =>
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
        if (macro.expression[tokenIndex]?.text === arg.name) {
          expression[tokenIndex] = arg.value;
        }
      }
    }

    return expression;
  };

import { SyntaxError } from '@ts-c-compiler/grammar';
import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';
import {
  AsmOutputConstraintFlags,
  ASTCAsmStmtOutputConstraint,
} from 'frontend/parser/ast';

import { CGrammar } from '../../shared';

function parseConstraint(constraint: string) {
  const flags: AsmOutputConstraintFlags = {
    overwriteExistingValue: false,
    readAndWrite: false,
    register: false,
    memory: false,
  };

  // Output constraints must begin with either ‘=’ (a variable overwriting an existing value)
  // or ‘+’ (when reading and writing). When using ‘=’, do not assume the location contains
  // the existing value on entry to the asm, except when the operand is tied to an input.
  switch (constraint[0]) {
    case '=':
      flags.overwriteExistingValue = true;
      break;

    case '+':
      flags.readAndWrite = true;
      break;

    default:
      throw new SyntaxError();
  }

  // Choose constraint between `reg` and `mem`
  for (let i = 1; i < constraint.length; ++i) {
    switch (constraint[i]) {
      case 'r':
        flags.register = true;
        break;

      case 'm':
        flags.memory = true;
        break;

      default:
        throw new SyntaxError();
    }
  }

  return flags;
}

export function asmOutputConstraint(
  grammar: CGrammar,
): ASTCAsmStmtOutputConstraint {
  const { g } = grammar;
  const constraint = g.match({
    type: TokenType.QUOTE,
  });

  return new ASTCAsmStmtOutputConstraint(
    NodeLocation.fromTokenLoc(constraint.loc),
    parseConstraint(constraint.text),
  );
}

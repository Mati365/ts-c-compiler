import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { TokenType } from '@compiler/lexer/shared';
import {
  AsmInputConstraintFlags,
  ASTCAsmStmtInputConstraint,
} from '@compiler/pico-c/frontend/parser/ast';

import { CGrammar } from '../../shared';

function parseConstraint(constraint: string) {
  const flags: AsmInputConstraintFlags = {
    register: false,
    memory: false,
  };

  // Choose constraint between `reg` and `mem`
  for (let i = 0; i < constraint.length; ++i) {
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

export function asmInputConstraint(
  grammar: CGrammar,
): ASTCAsmStmtInputConstraint {
  const { g } = grammar;
  const constraint = g.match({
    type: TokenType.QUOTE,
  });

  return new ASTCAsmStmtInputConstraint(
    NodeLocation.fromTokenLoc(constraint.loc),
    parseConstraint(constraint.text),
  );
}

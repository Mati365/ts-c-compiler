import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';
import { AsmInputConstraintFlags, ASTCAsmStmtInputConstraint } from 'frontend/parser/ast';

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

export function asmInputConstraint(grammar: CGrammar): ASTCAsmStmtInputConstraint {
  const { g } = grammar;
  const constraint = g.match({
    type: TokenType.QUOTE,
  });

  return new ASTCAsmStmtInputConstraint(
    NodeLocation.fromTokenLoc(constraint.loc),
    parseConstraint(constraint.text),
  );
}

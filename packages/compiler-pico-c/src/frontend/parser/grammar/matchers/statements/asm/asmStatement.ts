import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { TokenType } from '@compiler/lexer/shared';
import { CCompilerKeyword } from '@compiler/pico-c/constants';

import { CGrammar } from '../../shared';
import {
  ASTCAsmStatement,
  ASTCAsmStmtInputOperand,
  ASTCAsmStmtOutputOperand,
  ASTCAsmClobberOperand,
} from '../../../../ast';

import { fetchSplittedProductionsList } from '../../utils';
import { stringLiteral } from '../../types';

import { asmOutputOperand } from './asmOutputOperand';
import { asmInputOperand } from './asmInputOperand';
import { asmClobberOperand } from './asmClobberOperand';

/**
 * asm asm-qualifiers ( AssemblerTemplate
 *                    : OutputOperands
 *                    : InputOperands
 *                    : Clobbers );
 */
export function asmStatement(grammar: CGrammar): ASTCAsmStatement {
  const { g } = grammar;
  const startToken = g.identifier(CCompilerKeyword.ASM);

  g.terminal('(');

  const expression = stringLiteral(grammar);
  const consumeOptionalNextOperand = () =>
    g.match({
      type: TokenType.COLON,
      optional: true,
    });

  // OUTPUT
  const hasOutput = consumeOptionalNextOperand();
  let outputOperands: ASTCAsmStmtOutputOperand[] = null;

  if (hasOutput && g.currentToken.type !== TokenType.COLON) {
    outputOperands = fetchSplittedProductionsList({
      g: grammar.g,
      prodFn: () => asmOutputOperand(grammar),
    });
  }

  // INPUT
  const hasInput = hasOutput && consumeOptionalNextOperand();
  let inputOperands: ASTCAsmStmtInputOperand[] = null;

  if (hasInput && g.currentToken.type !== TokenType.COLON) {
    inputOperands = fetchSplittedProductionsList({
      g: grammar.g,
      prodFn: () => asmInputOperand(grammar),
    });
  }

  // CLOBBERS
  const hasClobbers = hasInput && consumeOptionalNextOperand();
  let clobberOperands: ASTCAsmClobberOperand[] = null;

  if (hasClobbers && g.currentToken.type !== TokenType.COLON) {
    clobberOperands = fetchSplittedProductionsList({
      g: grammar.g,
      prodFn: () => asmClobberOperand(grammar),
    });
  }

  g.terminal(')');
  g.terminalType(TokenType.SEMICOLON);

  return new ASTCAsmStatement(
    NodeLocation.fromTokenLoc(startToken.loc),
    expression.stringLiteral,
    outputOperands,
    inputOperands,
    clobberOperands,
  );
}

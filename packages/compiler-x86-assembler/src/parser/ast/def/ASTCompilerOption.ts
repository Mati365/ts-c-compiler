import * as R from 'ramda';

import {Token, TokenKind} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {KindASTNode} from '../ASTAsmNode';
import {ASTNodeKind} from '../types';
import {ASTAsmParser} from '../ASTAsmParser';

import {fetchInstructionTokensArgsList, toStringArgsList} from '../../utils';
import {asmLexer} from '../../lexer/asmLexer';

export enum CompilerOptions {
  ORG = 'ORG',
  BITS = 'BITS',
}

/**
 * Used to define binary data variables
 *
 * @export
 * @class ASTCompilerOption
 * @extends {KindASTNode(ASTNodeKind.COMPILER_OPTION)}
 */
export class ASTCompilerOption extends KindASTNode(ASTNodeKind.COMPILER_OPTION) {
  constructor(
    public readonly option: string,
    public readonly args: Token<any>[],
    loc: NodeLocation,
  ) {
    super(loc);
  }

  toString() {
    const {option, args} = this;

    return `[${toStringArgsList(option, args)}]`;
  }

  /**
   * Watches if instruction is compiler arg
   *
   * @static
   * @param {Token} token
   * @param {ASTAsmParser} parser
   * @returns {ASTLabel}
   * @memberof ASTLabel
   */
  static parse(token: Token, parser: ASTAsmParser): ASTCompilerOption {
    let optionName = token.upperText;
    const inBrackets = token.kind === TokenKind.SQUARE_BRACKET;

    if (inBrackets)
      [optionName] = R.split(' ', optionName);

    const option = CompilerOptions[optionName];
    if (R.isNil(option))
      return null;

    // option can be [org 0x80] or org 0x80, second is instruction
    let args = null;
    if (inBrackets)
      args = R.slice(1, -1, Array.from(asmLexer(null, token.text)));
    else
      args = fetchInstructionTokensArgsList(parser, false);

    // create new option
    return new ASTCompilerOption(
      optionName,
      args,
      NodeLocation.fromTokenLoc(token.loc),
    );
  }
}

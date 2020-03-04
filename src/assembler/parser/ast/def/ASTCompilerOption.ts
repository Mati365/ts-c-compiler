import * as R from 'ramda';

import {Token, TokenKind} from '../../lexer/tokens';
import {KindASTNode, ASTNodeLocation} from '../ASTNode';
import {ASTNodeKind} from '../types';
import {ASTParser} from '../ASTParser';

import {fetchInstructionTokensArgsList, toStringArgsList} from '../../utils';
import {lexer} from '../../lexer/lexer';

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
    loc: ASTNodeLocation,
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
   * @param {ASTParser} parser
   * @returns {ASTLabel}
   * @memberof ASTLabel
   */
  static parse(token: Token, parser: ASTParser): ASTCompilerOption {
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
      args = R.slice(1, -1, Array.from(lexer(token.text)));
    else
      args = fetchInstructionTokensArgsList(parser);

    // create new option
    return new ASTCompilerOption(
      optionName,
      args,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}

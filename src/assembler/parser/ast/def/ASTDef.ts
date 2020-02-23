import * as R from 'ramda';

import {ASTParser} from '../ASTParser';
import {ASTNodeKind} from '../types';
import {InstructionArgSize} from '../../../types';
import {Token, TokenType} from '../../lexer/tokens';
import {
  ASTNodeLocation,
  KindASTNode,
} from '../ASTNode';

import {
  fetchTokensArgsList,
  toStringArgsList,
} from '../instruction/ASTInstruction';

export enum DefTokenNames {
  DB = InstructionArgSize.BYTE,
  DW = InstructionArgSize.WORD,
  DQ = InstructionArgSize.DWORD,
}

/**
 * Used to define binary data variables
 *
 * @export
 * @class ASTDef
 * @extends {KindASTNode(ASTNodeKind.DEFINE)}
 */
export class ASTDef extends KindASTNode(ASTNodeKind.DEFINE) {
  constructor(
    public readonly byteSize: number,
    public readonly args: Token[],
    loc: ASTNodeLocation,
  ) {
    super(loc);
  }

  /**
   * @returns {string}
   * @memberof ASTInstruction
   */
  toString(): string {
    const {byteSize, args} = this;

    return toStringArgsList(
      DefTokenNames[byteSize],
      args,
    );
  }

  /**
   * Defines binary data
   *
   * @static
   * @param {Token} token
   * @param {ASTParser} parser
   * @returns {ASTLabel}
   * @memberof ASTLabel
   */
  static parse(token: Token, parser: ASTParser): ASTDef {
    if (token.type !== TokenType.KEYWORD)
      return null;

    // check definition size
    const tokenDefSize: number = DefTokenNames[R.toUpper(token.text)];
    if (!tokenDefSize)
      return null;

    // pick all args
    const argsTokens = fetchTokensArgsList(parser, false);

    // define ast node
    return new ASTDef(
      tokenDefSize,
      argsTokens,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}

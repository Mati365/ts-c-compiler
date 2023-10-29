import * as R from 'ramda';

import { Token, TokenType, NumberToken } from '@ts-c/lexer';
import { NodeLocation } from '@ts-c/grammar';

import { ParserError, ParserErrorCode } from '../../../shared/ParserError';
import { ASTAsmParser } from '../ASTAsmParser';
import { ASTNodeKind } from '../types';
import { InstructionArgSize } from '../../../types';
import { KindASTAsmNode } from '../ASTAsmNode';

import { toStringArgsList } from '../../utils/toStringArgsList';
import { fetchInstructionTokensArgsList } from '../../utils/fetchInstructionTokensArgsList';

export enum DefTokenNames {
  DB = InstructionArgSize.BYTE,
  DW = InstructionArgSize.WORD,
  DD = InstructionArgSize.DWORD,
  DQ = InstructionArgSize.QWORD,
  DT = InstructionArgSize.TWORD,
}

/**
 * Checks if token is size def, if so - return size
 */
export function tokenDefSize(token: string | Token): number {
  if (token instanceof Token) {
    if (token.type !== TokenType.KEYWORD) {
      return null;
    }

    return DefTokenNames[token.upperText];
  }

  return DefTokenNames[token.toUpperCase()] ?? null;
}

/**
 * Used to define binary data variables
 */
export class ASTDef extends KindASTAsmNode(ASTNodeKind.DEFINE) {
  constructor(
    readonly byteSize: number,
    readonly args: Token[],
    loc: NodeLocation,
  ) {
    super(loc);
  }

  clone(): ASTDef {
    const { byteSize, args, loc } = this;

    return new ASTDef(byteSize, args, loc);
  }

  toString(): string {
    const { byteSize, args } = this;

    return toStringArgsList(DefTokenNames[byteSize], args);
  }

  /**
   * Defines binary data
   */
  static parse(token: Token, parser: ASTAsmParser): ASTDef {
    if (token.type !== TokenType.KEYWORD) {
      return null;
    }

    // check definition size
    const tokenSize: number = tokenDefSize(token);
    if (!tokenSize) {
      return null;
    }

    // pick all args
    const argsTokens = fetchInstructionTokensArgsList(parser, false);

    if (R.isEmpty(argsTokens)) {
      throw new ParserError(
        ParserErrorCode.EMPTY_DATA_DEFINITION_LIST,
        token.loc,
      );
    }

    // throw error if any number exceddes token def size
    // todo: check strings?
    R.forEach(arg => {
      if (arg.type !== TokenType.NUMBER) {
        return;
      }

      const numberToken = <NumberToken>arg;
      if (numberToken.value.byteSize > tokenSize) {
        throw new ParserError(
          ParserErrorCode.DEFINED_DATA_EXCEEDES_BOUNDS,
          token.loc,
          {
            data: numberToken.text,
            maxSize: tokenSize,
          },
        );
      }
    }, argsTokens);

    return new ASTDef(
      tokenSize,
      argsTokens,
      NodeLocation.fromTokenLoc(token.loc),
    );
  }
}

import { dumpAttributesToString } from '@ts-cc/core';
import { joinTokensTexts } from '@ts-cc/lexer';

import { NodeLocation } from '@ts-cc/grammar';
import { Token } from '@ts-cc/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCIdentifiersList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly identifiers: Token[],
  ) {
    super(ASTCCompilerKind.IdentifiersList, loc);
  }

  toString() {
    const { kind, identifiers } = this;
    const tokens = identifiers ? joinTokensTexts(' ', identifiers) : '';

    return dumpAttributesToString(kind, {
      identifiers: tokens,
    });
  }
}

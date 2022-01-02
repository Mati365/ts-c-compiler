import {dumpAttributesToString} from '@compiler/core/utils';
import {joinTokensTexts} from '@compiler/lexer/utils';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCIdentifiersList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly identifiers: Token[],
  ) {
    super(ASTCCompilerKind.IdentifiersList, loc);
  }

  toString() {
    const {kind, identifiers} = this;
    const tokens = (
      identifiers
        ? joinTokensTexts(' ', identifiers)
        : ''
    );

    return dumpAttributesToString(
      kind,
      {
        identifiers: tokens,
      },
    );
  }
}

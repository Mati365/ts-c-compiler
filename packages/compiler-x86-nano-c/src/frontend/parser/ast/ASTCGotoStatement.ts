import {dumpAttributesToString} from '@compiler/core/utils';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCGotoStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: Token<string>,
  ) {
    super(ASTCCompilerKind.GotoStmt, loc);
  }

  toString() {
    const {kind, name} = this;

    return dumpAttributesToString(
      kind,
      {
        name: name.text,
      },
    );
  }
}

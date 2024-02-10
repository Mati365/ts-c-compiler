import { dumpAttributesToString } from '@ts-c-compiler/core';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { Token } from '@ts-c-compiler/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCGotoStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
  ) {
    super(ASTCCompilerKind.GotoStmt, loc);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name: name.text,
    });
  }
}

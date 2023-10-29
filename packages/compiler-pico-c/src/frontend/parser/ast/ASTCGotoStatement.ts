import { dumpAttributesToString } from '@ts-c/core';

import { NodeLocation } from '@ts-c/grammar';
import { Token } from '@ts-c/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCGotoStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly name: Token<string>) {
    super(ASTCCompilerKind.GotoStmt, loc);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name: name.text,
    });
  }
}

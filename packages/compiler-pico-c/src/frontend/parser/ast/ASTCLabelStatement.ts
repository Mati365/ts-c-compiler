import { dumpAttributesToString } from '@ts-cc/core';

import { NodeLocation } from '@ts-cc/grammar';
import { Token } from '@ts-cc/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCLabelStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
  ) {
    super(ASTCCompilerKind.LabelStmt, loc);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name: name.text,
    });
  }
}

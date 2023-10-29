import { dumpAttributesToString } from '@ts-c/core';
import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { Token } from '@ts-c/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['statement'],
})
export class ASTCLabelStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
    readonly statement: ASTCCompilerNode,
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

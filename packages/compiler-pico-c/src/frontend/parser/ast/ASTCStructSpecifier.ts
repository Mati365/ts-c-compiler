import * as R from 'ramda';

import { dumpAttributesToString } from '@ts-cc/core';
import { walkOverFields } from '@ts-cc/grammar';

import { Token } from '@ts-cc/lexer';
import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCStructDeclarationList } from './ASTCStructDeclarationList';

@walkOverFields({
  fields: ['list'],
})
export class ASTCStructSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly list: ASTCStructDeclarationList,
    readonly name?: Token<string>,
    kind: ASTCCompilerKind = ASTCCompilerKind.StructSpecifier,
  ) {
    super(kind, loc);
  }

  hasDeclarationList() {
    return !R.isNil(this.list);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name: name?.text,
    });
  }
}

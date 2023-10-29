import * as R from 'ramda';

import { walkOverFields } from '@ts-c/grammar';
import { dumpAttributesToString } from '@ts-c/core';

import { NodeLocation } from '@ts-c/grammar';
import { Token } from '@ts-c/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCEnumEnumeration } from './ASTCEnumEnumerator';

/**
 * Node that holds C enums
 */
@walkOverFields({
  fields: ['enumerations'],
})
export class ASTCEnumSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
    readonly enumerations: ASTCEnumEnumeration[],
  ) {
    super(ASTCCompilerKind.EnumSpecifier, loc);
  }

  hasEnumerations() {
    return !R.isNil(this.enumerations);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name,
    });
  }
}

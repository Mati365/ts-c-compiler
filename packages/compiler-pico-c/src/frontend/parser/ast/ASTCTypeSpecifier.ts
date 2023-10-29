import { dumpAttributesToString } from '@ts-c/core';
import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { Token } from '@ts-c/lexer';
import { CTypeSpecifier } from '../../../constants';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCEnumSpecifier } from './ASTCEnumSpecifier';
import { ASTCStructSpecifier } from './ASTCStructSpecifier';
import { CGrammarTypedefEntry } from '../grammar/matchers';

@walkOverFields({
  fields: ['specifier', 'typeName', 'enumSpecifier', 'structOrUnionSpecifier'],
})
export class ASTCTypeSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly specifier?: CTypeSpecifier,
    readonly typeName?: Token,
    readonly enumSpecifier?: ASTCEnumSpecifier,
    readonly structOrUnionSpecifier?: ASTCStructSpecifier,
    readonly typedefEntry?: CGrammarTypedefEntry,
  ) {
    super(ASTCCompilerKind.TypeSpecifier, loc);
  }

  get displayName() {
    const { specifier, typeName } = this;

    return (specifier || typeName?.text)?.trim();
  }

  toString() {
    const { kind, displayName, typedefEntry } = this;

    return dumpAttributesToString(kind, {
      displayName,
      typedefEntry: !!typedefEntry,
    });
  }
}

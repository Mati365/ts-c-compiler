import { dumpAttributesToString } from '@ts-cc/core';
import { walkOverFields } from '@ts-cc/grammar';

import { NodeLocation } from '@ts-cc/grammar';
import { Token } from '@ts-cc/lexer';
import { CTypeSpecifier } from '../../../constants';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCEnumSpecifier } from './ASTCEnumSpecifier';
import { ASTCStructSpecifier } from './ASTCStructSpecifier';
import { ASTCUnionSpecifier } from './ASTCUnionSpecifier';
import { CGrammarTypedefEntry } from '../grammar/matchers';

@walkOverFields({
  fields: ['specifier', 'typeName', 'enumSpecifier', 'structSpecifier', 'unionSpecifier'],
})
export class ASTCTypeSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly specifier?: CTypeSpecifier,
    readonly typeName?: Token,
    readonly enumSpecifier?: ASTCEnumSpecifier,
    readonly structSpecifier?: ASTCStructSpecifier,
    readonly unionSpecifier?: ASTCUnionSpecifier,
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

import * as R from 'ramda';

import { walkOverFields } from '@ts-c-compiler/grammar';

import { IsEmpty } from '@ts-c-compiler/core';
import { NodeLocation } from '@ts-c-compiler/grammar';

import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCTypeSpecifier } from './ASTCTypeSpecifier';

type GroupedSpecifiersResult = {
  primitives: ASTCTypeSpecifier[];
  structs: ASTCTypeSpecifier[];
  unions: ASTCTypeSpecifier[];
  enums: ASTCTypeSpecifier[];
  typedefs: ASTCTypeSpecifier[];
};

@walkOverFields({
  fields: ['items'],
})
export class ASTCTypeSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    readonly items: ASTCTypeSpecifier[],
  ) {
    super(ASTCCompilerKind.TypeSpecifiersList, loc);
  }

  getGroupedSpecifiers() {
    return this.items.reduce<GroupedSpecifiersResult>(
      (acc, item) => {
        if (item.specifier) {
          acc.primitives.push(item);
        } else if (item.structSpecifier) {
          acc.structs.push(item);
        } else if (item.unionSpecifier) {
          acc.unions.push(item);
        } else if (item.enumSpecifier) {
          acc.enums.push(item);
        } else if (item.typedefEntry) {
          acc.typedefs.push(item);
        }

        return acc;
      },
      {
        primitives: [],
        structs: [],
        enums: [],
        unions: [],
        typedefs: [],
      },
    );
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}

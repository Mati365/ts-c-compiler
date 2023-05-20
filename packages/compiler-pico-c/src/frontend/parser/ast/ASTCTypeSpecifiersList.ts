import * as R from 'ramda';

import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { IsEmpty } from '@compiler/core/interfaces/IsEmpty';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';

import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCTypeSpecifier } from './ASTCTypeSpecifier';

@walkOverFields({
  fields: ['items'],
})
export class ASTCTypeSpecifiersList
  extends ASTCCompilerNode
  implements IsEmpty
{
  constructor(loc: NodeLocation, readonly items: ASTCTypeSpecifier[]) {
    super(ASTCCompilerKind.TypeSpecifiersList, loc);
  }

  getGroupedSpecifiers() {
    type Result = {
      primitives: ASTCTypeSpecifier[];
      structs: ASTCTypeSpecifier[];
      enums: ASTCTypeSpecifier[];
      typedefs: ASTCTypeSpecifier[];
    };

    return this.items.reduce<Result>(
      (acc, item) => {
        if (item.specifier) {
          acc.primitives.push(item);
        } else if (item.structOrUnionSpecifier) {
          acc.structs.push(item);
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
        typedefs: [],
      },
    );
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}

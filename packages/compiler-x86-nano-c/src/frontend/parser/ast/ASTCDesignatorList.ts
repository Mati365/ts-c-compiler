import * as R from 'ramda';

import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {IsEmpty} from '@compiler/core/interfaces/IsEmpty';

import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCDesignator} from './ASTCDesignator';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCDesignatorList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCDesignator[],
  ) {
    super(ASTCCompilerKind.DesignatorList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}

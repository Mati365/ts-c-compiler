import * as R from 'ramda';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CFunctionSpecifier} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {IsEmpty} from './interfaces/IsEmpty';

export class ASTCFunctionSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: CFunctionSpecifier[],
  ) {
    super(ASTCCompilerKind.FunctionSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }

  toString() {
    const {kind, items} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        items: items?.join(' '),
      },
    );
  }
}

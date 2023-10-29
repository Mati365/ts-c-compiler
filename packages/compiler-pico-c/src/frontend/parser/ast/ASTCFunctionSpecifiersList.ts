import * as R from 'ramda';

import { dumpAttributesToString } from '@ts-c/core';

import { IsEmpty } from '@ts-c/core';
import { NodeLocation } from '@ts-c/grammar';

import { CFunctionSpecifier } from '#constants';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCFunctionSpecifiersList
  extends ASTCCompilerNode
  implements IsEmpty
{
  constructor(loc: NodeLocation, readonly items: CFunctionSpecifier[]) {
    super(ASTCCompilerKind.FunctionSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }

  toString() {
    const { kind, items } = this;

    return dumpAttributesToString(kind, {
      items: items?.join(' '),
    });
  }
}

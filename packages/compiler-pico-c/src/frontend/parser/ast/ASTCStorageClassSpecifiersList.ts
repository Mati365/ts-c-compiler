import * as R from 'ramda';

import { dumpAttributesToString } from '@ts-cc/core';

import { IsEmpty } from '@ts-cc/core';
import { NodeLocation } from '@ts-cc/grammar';

import { CStorageClassSpecifier } from '#constants';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCStorageClassSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    readonly items: CStorageClassSpecifier[],
  ) {
    super(ASTCCompilerKind.StorageClassSpecifiersList, loc);
  }

  isTypedef() {
    return this.items.includes(CStorageClassSpecifier.TYPEDEF);
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

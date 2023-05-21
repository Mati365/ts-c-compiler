import * as R from 'ramda';

import { Identity } from '@compiler/core/monads';
import { CType } from '../../types/CType';

export type CNamedTypedEntryDescriptor = {
  type: CType;
  name: string;
};

export function isNamedTypeEntry(obj: any): obj is CNamedTypedEntry {
  return obj && R.is(Object, obj) && obj.unwrap && 'name' in obj.unwrap().value;
}

/**
 * Object used to store fields from structures / enums / variables
 */
export class CNamedTypedEntry<
  D extends CNamedTypedEntryDescriptor = CNamedTypedEntryDescriptor,
> extends Identity<D> {
  static ofAnonymousType(type: CType) {
    return new CNamedTypedEntry<CNamedTypedEntryDescriptor>({
      type,
      name: null,
    });
  }

  get name() {
    return this.value.name;
  }

  get type() {
    return this.value.type;
  }

  getDisplayName() {
    const { type, name } = this.unwrap();

    return `${type.getShortestDisplayName()} ${name || '<anonymous>'}`;
  }

  /**
   * Check if type contains name
   */
  isAnonymous(): boolean {
    return !this.value.name;
  }

  ofName(name: string) {
    return this.map(value => ({
      ...value,
      name: name,
    }));
  }

  ofType(type: CType) {
    return this.map(value => ({
      ...value,
      type,
    }));
  }

  mapType(fn: (type: CType) => CType) {
    return this.map(value => ({
      ...value,
      type: fn(value.type),
    }));
  }
}

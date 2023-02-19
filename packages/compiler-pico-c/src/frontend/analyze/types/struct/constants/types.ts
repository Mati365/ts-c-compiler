import { CStructAlign } from '@compiler/pico-c/constants';
import { CType, CTypeDescriptor } from '../../CType';
import {
  CNamedTypedEntry,
  CNamedTypedEntryDescriptor,
} from '../../../scope/variables/CNamedTypedEntry';

export type CStructEntryDescriptor = CNamedTypedEntryDescriptor & {
  offset: number;
  index: number;
  bitset?: number;
};

export class CStructEntry extends CNamedTypedEntry<CStructEntryDescriptor> {
  get offset() {
    return this.value.offset;
  }
  get index() {
    return this.value.index;
  }
}

export type CStructFieldsMap = Map<string, CStructEntry>;
export type CStructTypeDescriptor = CTypeDescriptor & {
  name?: string;
  align: CStructAlign;
  fields: CStructFieldsMap;
};

export type StructFieldAlignFn = (struct: CType, type: CType) => number;

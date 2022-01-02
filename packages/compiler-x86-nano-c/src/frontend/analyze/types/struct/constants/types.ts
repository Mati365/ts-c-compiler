import {CStructAlign} from '@compiler/x86-nano-c/constants';
import {CType, CTypeDescriptor} from '../../CType';
import {
  CNamedTypedEntry,
  CNamedTypedEntryDescriptor,
} from '../../../variables/CNamedTypedEntry';

export type CStructEntryDescriptor = CNamedTypedEntryDescriptor & {
  offset: number,
  bitset?: number,
};

export class CStructEntry extends CNamedTypedEntry<CStructEntryDescriptor> {
  getOffset() { return this.value.offset; }
}

export type CStructFieldsMap = Map<string, CStructEntry>;
export type CStructTypeDescriptor = CTypeDescriptor & {
  name?: string,
  align: CStructAlign,
  fields: CStructFieldsMap,
};

export type StructFieldAlignFn = (struct: CType, type: CType) => number;

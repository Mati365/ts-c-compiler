import { CTypeDescriptor } from '../../CType';
import { CNamedTypedEntry } from '../../../scope/variables/CNamedTypedEntry';

export class CUnionEntry extends CNamedTypedEntry {}

export type CUnionFieldsMap = Map<string, CUnionEntry>;

export type CUnionTypeDescriptor = CTypeDescriptor & {
  name?: string;
  fields: CUnionFieldsMap;
};

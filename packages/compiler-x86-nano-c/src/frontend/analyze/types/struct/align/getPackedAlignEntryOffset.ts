import {StructFieldAlignFn} from '../constants/types';

export const getPackedAlignEntryOffset: StructFieldAlignFn = (struct) => struct.getByteSize();

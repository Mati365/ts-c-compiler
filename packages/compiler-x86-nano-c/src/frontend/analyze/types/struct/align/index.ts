import {CStructAlign} from '@compiler/x86-nano-c/constants';
import {StructFieldAlignFn} from '../constants/types';
import {getPackedAlignEntryOffset} from './getPackedAlignEntryOffset';

export const StructFieldAligner: Record<CStructAlign, StructFieldAlignFn> = {
  [CStructAlign.PACKED]: getPackedAlignEntryOffset,
};

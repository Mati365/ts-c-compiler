import {CStructAlign} from '@compiler/pico-c/constants';
import {StructFieldAlignFn} from '../constants/types';
import {getPackedAlignEntryOffset} from './getPackedAlignEntryOffset';

export const StructFieldAligner: Record<CStructAlign, StructFieldAlignFn> = {
  [CStructAlign.PACKED]: getPackedAlignEntryOffset,
};

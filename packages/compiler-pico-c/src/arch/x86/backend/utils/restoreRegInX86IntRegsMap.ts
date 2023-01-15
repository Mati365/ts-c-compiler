import * as R from 'ramda';

import { RegsMap } from '../../constants/regs';

import {
  recursiveX86RegMapLookup,
  X86RegLookupQuery,
} from './recursiveX86RegMapLookup';

import { recursiveSetAvailabilityInX86RegMap } from './recursiveSetAvailabilityInX86RegMap';
import { X86IntRegsMapQueryResult } from './queryFromX86IntRegsMap';

export function restoreRegInX86IntRegsMap(
  query: Omit<X86RegLookupQuery, 'withUnavailable'>,
  availableRegs: RegsMap,
): X86IntRegsMapQueryResult {
  const path = recursiveX86RegMapLookup(
    {
      ...query,
      withUnavailable: true,
    } as X86RegLookupQuery,
    availableRegs.int,
  );

  if (!path) {
    return null;
  }

  const intRegs = recursiveSetAvailabilityInX86RegMap({
    unavailable: false,
    list: availableRegs.int,
    path,
  });

  return {
    reg: R.last(path).name,
    availableRegs: {
      ...availableRegs,
      int: intRegs,
    },
  };
}

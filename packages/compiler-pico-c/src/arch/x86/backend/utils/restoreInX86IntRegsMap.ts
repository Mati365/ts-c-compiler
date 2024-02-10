import { RegsMap } from '../../constants/regs';

import { recursiveSetAvailabilityInX86RegMap } from './recursiveSetAvailabilityInX86RegMap';
import { recursiveX86RegMapLookup, X86RegLookupQuery } from './recursiveX86RegMapLookup';

type RegsUpdaterQuery = Omit<X86RegLookupQuery, 'withUnavailable'>;

export function setAvailabilityInRegsMap(
  query: RegsUpdaterQuery,
  unavailable: boolean,
  availableRegs: RegsMap,
): RegsMap {
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
    unavailable,
    list: availableRegs.int,
    path,
  });

  return {
    ...availableRegs,
    int: intRegs,
  };
}

export function restoreInX86IntRegsMap(
  query: RegsUpdaterQuery,
  availableRegs: RegsMap,
): RegsMap {
  return setAvailabilityInRegsMap(query, false, availableRegs);
}

import { RegsMap } from '../../constants/regs';
import { X86RegLookupQuery } from './recursiveX86RegMapLookup';
import { queryX86RegsMap, X86RegsMapQueryResult } from './queryX86RegsMap';

import { recursiveSetAvailabilityInX86RegMap } from './recursiveSetAvailabilityInX86RegMap';

export type X86RegsMapQueryAndSetResult = Pick<X86RegsMapQueryResult, 'reg'> & {
  availableRegs: RegsMap;
};

export function queryAndMarkX86RegsMap(
  query: X86RegLookupQuery,
  availableRegs: RegsMap,
): X86RegsMapQueryAndSetResult {
  const queryResult = queryX86RegsMap(query, availableRegs);

  if (!queryResult) {
    return null;
  }

  const { reg, list, path } = queryResult;
  const updatedRegs = recursiveSetAvailabilityInX86RegMap({
    unavailable: true,
    list,
    path,
  });

  return {
    reg,
    availableRegs: {
      ...availableRegs,
      int: updatedRegs,
    },
  };
}

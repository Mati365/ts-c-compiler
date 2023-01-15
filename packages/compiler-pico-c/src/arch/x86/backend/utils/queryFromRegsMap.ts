import * as R from 'ramda';

import { CType, isPrimitiveLikeType } from '@compiler/pico-c/frontend/analyze';
import { X86RegName } from '@x86-toolkit/assembler';
import { X87StackRegName } from '@x86-toolkit/cpu/x87/X87Regs';
import { RegsMap } from '../../constants/regs';

import { recursiveRegMapLookupBy } from './recursiveRegMapLookupBy';
import { recursiveSetAvailabilityInRegMap } from './resursiveSetAvailabilityInRegMap';

export type RegsMapQuery = {
  type?: CType;
  reg?: X86RegName;
};

export type RegsMapQueryResult = {
  reg: X86RegName | X87StackRegName;
  availableRegs: RegsMap;
};

export function queryFromRegsMap(
  { type, reg }: RegsMapQuery,
  availableRegs: RegsMap,
): RegsMapQueryResult {
  if (!isPrimitiveLikeType(type)) {
    return null;
  }

  if (type.isIntegral()) {
    const path = recursiveRegMapLookupBy(
      {
        reg,
        size: type?.getByteSize(),
      },
      availableRegs.int,
    );

    if (!path) {
      return null;
    }

    const intRegs = recursiveSetAvailabilityInRegMap({
      unavailable: true,
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

  return null;
}

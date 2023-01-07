import * as R from 'ramda';

import { Option, none } from '@compiler/core/monads';
import { CType, isPrimitiveLikeType } from '@compiler/pico-c/frontend/analyze';
import { X86RegName } from '@x86-toolkit/assembler';
import { X87StackRegName } from '@x86-toolkit/cpu/x87/X87Regs';
import { RegsMap } from '../../constants/regs';

import { recursiveRegMapLookupBySize } from './recursiveRegMapLookupBySize';
import { recursiveSetAvailabilityInRegMap } from './resursiveSetAvailabilityInRegMap';

export type RegsMapQuery = {
  type: CType;
};

export type RegsMapQueryResult = {
  reg: X86RegName | X87StackRegName;
  availableRegs: RegsMap;
};

export function queryFromRegsMap(
  { type }: RegsMapQuery,
  availableRegs: RegsMap,
): Option<RegsMapQueryResult> {
  if (!isPrimitiveLikeType(type)) {
    return none();
  }

  if (type.isIntegral()) {
    return recursiveRegMapLookupBySize(
      type.getByteSize(),
      availableRegs.int,
    ).map(path => {
      const intRegs = recursiveSetAvailabilityInRegMap(path, availableRegs.int);

      return {
        reg: R.last(path).name,
        availableRegs: {
          ...availableRegs,
          int: intRegs,
        },
      };
    });
  }

  return none();
}

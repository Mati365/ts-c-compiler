import * as R from 'ramda';

import { X86RegName, X87StackRegName } from '@ts-c-compiler/x86-assembler';
import { RegsMap, X86IntRegTree } from '../../constants/regs';

import {
  recursiveX86RegMapLookup,
  X86RegLookupQuery,
} from './recursiveX86RegMapLookup';

export type X86RegsMapQueryResult = {
  reg: X86RegName | X87StackRegName;
  path: X86IntRegTree[];
  list: X86IntRegTree[];
};

export function queryX86RegsMap(
  query: X86RegLookupQuery,
  availableRegs: RegsMap,
): X86RegsMapQueryResult {
  const list = availableRegs.int;
  const path = recursiveX86RegMapLookup(query, list);

  if (!path) {
    return null;
  }

  return {
    reg: R.last(path).name,
    path,
    list,
  };
}

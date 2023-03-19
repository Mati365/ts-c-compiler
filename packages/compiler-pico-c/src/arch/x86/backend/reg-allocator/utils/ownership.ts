import { X86RegName } from '@x86-toolkit/assembler/index';
import { X86StackVariable } from '../../X86StackFrame';

export type IRRegOwnership = {
  reg: X86RegName;
  noPrune?: boolean;
};

export type IRStackVarOwnership = {
  stackVar: X86StackVariable;
};

export type IRAddressVarOwnership = {
  address: string;
};

export type IROwnershipValue =
  | IRRegOwnership
  | IRStackVarOwnership
  | IRAddressVarOwnership;

export type IROwnershipMap = Partial<Record<string, IROwnershipValue>>;

export function isStackVarOwnership(
  ownership: IROwnershipValue,
): ownership is IRStackVarOwnership {
  return !!ownership && 'stackVar' in ownership;
}

export function isRegOwnership(
  ownership: IROwnershipValue,
): ownership is IRRegOwnership {
  return !!ownership && 'reg' in ownership;
}

export function isAddressOwnership(
  ownership: IROwnershipValue,
): ownership is IRAddressVarOwnership {
  return !!ownership && 'address' in ownership;
}

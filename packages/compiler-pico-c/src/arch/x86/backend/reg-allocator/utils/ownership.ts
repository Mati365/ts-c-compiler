import { X86RegName } from '@ts-c/x86-assembler';
import { X86StackVariable } from '../../X86StackFrame';

export type IRRegOwnership = {
  reg: X86RegName;
  noPrune?: boolean;
};

export type IRStackVarOwnership = {
  stackVar: X86StackVariable;
};

export type IRLabelVarOwnership = {
  asmLabel: string;
};

export type IROwnershipValue =
  | IRRegOwnership
  | IRStackVarOwnership
  | IRLabelVarOwnership;

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

export function isLabelOwnership(
  ownership: IROwnershipValue,
): ownership is IRLabelVarOwnership {
  return !!ownership && 'asmLabel' in ownership;
}

import { X86StackVariable } from '../../X86StackFrame';

export type IRStackVarOwnership = {
  stackVar: X86StackVariable;
};

export type IRLabelVarOwnership = {
  asmLabel: string;
};

export type IRMemOwnershipValue = IRStackVarOwnership | IRLabelVarOwnership;

export type IRMemOwnershipMap = Partial<Record<string, IRMemOwnershipValue>>;

export function isStackVarOwnership(
  ownership: IRMemOwnershipValue,
): ownership is IRStackVarOwnership {
  return !!ownership && 'stackVar' in ownership;
}

export function isLabelOwnership(
  ownership: IRMemOwnershipValue,
): ownership is IRLabelVarOwnership {
  return !!ownership && 'asmLabel' in ownership;
}

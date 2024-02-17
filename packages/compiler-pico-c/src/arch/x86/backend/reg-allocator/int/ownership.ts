import { X86RegName } from '@ts-cc/x86-assembler';

export type IRRegOwnership = {
  reg: X86RegName;
  noPrune?: boolean;
};

export type IRRegOwnershipMap = Partial<Record<string, IRRegOwnership>>;

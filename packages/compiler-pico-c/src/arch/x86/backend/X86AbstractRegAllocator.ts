import {
  IRInstruction,
  IRLoadInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';
import {
  IRInstructionVarArg,
  IRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import { X86RegName } from '@x86-toolkit/assembler';
import { X86RegLookupQuery } from './utils';
import { X86Allocator } from './X86Allocator';

export type IRRegReqResult = {
  asm: string[];
  value: X86RegName;
};

export type IRArgAllocatorResult<V extends string | number = string | number> =
  {
    asm: string[];
    value: V;
  };

type IRArgAllocatorTypedResult<
  T extends IRArgDynamicResolverType,
  V extends string | number,
> = IRArgAllocatorResult<V> & {
  type: T;
};

export enum IRArgDynamicResolverType {
  REG = 1,
  MEM = 2,
  NUMBER = 4,
}

export type IRDynamicArgAllocatorResult =
  | IRArgAllocatorTypedResult<IRArgDynamicResolverType.REG, X86RegName>
  | IRArgAllocatorTypedResult<IRArgDynamicResolverType.MEM, string>
  | IRArgAllocatorTypedResult<IRArgDynamicResolverType.NUMBER, number>;

export type IRArgDynamicResolverAttrs = {
  allow?: IRArgDynamicResolverType;
  arg: IRInstructionVarArg;
};

export type IRArgRegResolverAttrs = {
  specificReg?: X86RegName;
  arg: IRInstructionVarArg;
};

export abstract class X86AbstractRegAllocator {
  constructor(protected allocator: X86Allocator) {}

  get config() {
    return this.allocator.config;
  }

  get stackFrame() {
    return this.allocator.stackFrame;
  }

  abstract requestReg(query: X86RegLookupQuery): IRRegReqResult;

  abstract transferRegOwnership(inputVar: string, reg: X86RegName): void;

  abstract markRegAsUnused(reg: X86RegName): void;

  abstract onIRLoad(load: IRLoadInstruction): void;

  abstract onAnalyzeInstructionsBlock(instructions: IRInstruction[]): void;

  abstract tryResolveIRArgAsReg(
    attrs: IRArgRegResolverAttrs,
  ): IRArgAllocatorResult<X86RegName>;

  abstract tryResolveIRArgAsAddr(arg: IRVariable): IRArgAllocatorResult<string>;

  abstract tryResolveIrArg(
    attrs: IRArgDynamicResolverAttrs,
  ): IRDynamicArgAllocatorResult;
}

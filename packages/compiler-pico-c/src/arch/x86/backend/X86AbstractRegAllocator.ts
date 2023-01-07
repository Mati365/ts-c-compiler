import {
  IRInstruction,
  IRLoadInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import { IRInstructionVarArg } from '@compiler/pico-c/frontend/ir/variables';
import { X86RegName } from '@x86-toolkit/assembler';

import { IRBlockIterator } from './iterators/IRBlockIterator';
import { RegsMapQuery } from './utils';
import { X86Allocator } from './X86Allocator';

export type IRRegReqResult = {
  asm: string[];
  value: X86RegName;
};

export enum IRArgResolverType {
  REG = 1,
  MEM = 2,
  NUMBER = 3,
}

export type IRArgAllocatorResult = {
  asm: string[];
  value: number | string;
  type: IRArgResolverType;
};

export type IRArgAllocatorArgs<
  A extends IRInstructionVarArg = IRInstructionVarArg,
> = {
  iterator: IRBlockIterator;
  allow: IRArgResolverType;
  arg: A;
};

export abstract class X86AbstractRegAllocator {
  protected loadInstructions: Record<string, IRLoadInstruction> = {};

  constructor(protected allocator: X86Allocator) {}

  get config() {
    return this.allocator.config;
  }
  get stackFrame() {
    return this.allocator.stackFrame;
  }

  /**
   * Some instructions such like add / sub allows to skip enter
   * and load arg directly from memory.
   */
  pushIRLoad(load: IRLoadInstruction): this {
    this.loadInstructions[load.outputVar.name] = load;
    return this;
  }

  /**
   * Function executed before attending to compile instructions block
   */
  abstract analyzeInstructionsBlock(instructions: IRInstruction[]): void;

  /**
   * Fetches provided mem variable or constant to reg
   */
  abstract resolveIRArg(arg: IRArgAllocatorArgs): IRArgAllocatorResult;

  /**
   * Allocates plain new reg
   */
  abstract requestReg(query: RegsMapQuery): IRRegReqResult;
}

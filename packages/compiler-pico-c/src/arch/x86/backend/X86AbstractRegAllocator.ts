import * as R from 'ramda';

import {
  IRInstruction,
  IRLoadInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import {
  IRInstructionVarArg,
  IRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import { X86RegName } from '@x86-toolkit/assembler';
import { X86Allocator } from './X86Allocator';

type IRRegOwnershipValue = {
  reg: X86RegName;
  dirty?: boolean;
};

export type IRRegReqResult = {
  asm: string[];
  value: X86RegName;
};

export type IRArgAllocatorResult<V extends string | number = string | number> =
  {
    asm: string[];
    value: V;
  };

export enum IRArgDynamicResolverType {
  REG = 1,
  MEM = 2,
  NUMBER = 4,
}

export type IRDynamicArgAllocatorResult =
  | (IRArgAllocatorResult<X86RegName> & {
      type: IRArgDynamicResolverType.REG;
    })
  | (IRArgAllocatorResult<string> & {
      type: IRArgDynamicResolverType.MEM;
    })
  | (IRArgAllocatorResult<number> & {
      type: IRArgDynamicResolverType.NUMBER;
    });

export type IRArgDynamicResolverAttrs = {
  allow: IRArgDynamicResolverType;
  arg: IRInstructionVarArg;
};

export type IRArgRegResolverAttrs = {
  specificReg?: X86RegName;
  arg: IRInstructionVarArg;
};

export abstract class X86AbstractRegAllocator {
  protected loadInstructions: Record<string, IRLoadInstruction> = {};
  protected regOwnership: Partial<Record<string, IRRegOwnershipValue>> = {};

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
  setIRLoad(load: IRLoadInstruction): this {
    this.loadInstructions[load.outputVar.name] = load;
    return this;
  }

  dropOwnershipByReg(reg: X86RegName) {
    const { regOwnership } = this;

    for (const varName in regOwnership) {
      if (regOwnership[varName].reg === reg) {
        delete regOwnership[varName];
      }
    }
  }

  /**
   * Transfers register ownership between temp variables
   */
  transferRegOwnership(inputVar: string, reg: X86RegName) {
    this.dropOwnershipByReg(reg);
    this.regOwnership[inputVar] = {
      reg,
      dirty: false,
    };
  }

  /**
   * Get used by tmp instruction reg
   */
  getVarReg(inputVar: string) {
    return this.regOwnership[inputVar].reg;
  }

  releaseAllRegs() {
    R.forEachObjIndexed(({ dirty, reg }) => {
      if (dirty) {
        this.releaseReg(reg);
      }
    }, this.regOwnership);

    this.regOwnership = {};
  }

  abstract releaseReg(reg: X86RegName): void;

  abstract analyzeInstructionsBlock(instructions: IRInstruction[]): void;

  abstract tryResolveIRArgAsReg(
    attrs: IRArgRegResolverAttrs,
  ): IRArgAllocatorResult<X86RegName>;

  abstract tryResolveIRArgAsAddr(arg: IRVariable): IRArgAllocatorResult<string>;

  abstract tryResolveIrArg(
    attrs: IRArgDynamicResolverAttrs,
  ): IRDynamicArgAllocatorResult;
}

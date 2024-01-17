import { wrapAround } from '@ts-c-compiler/core';
import {
  createX87StackRegByIndex,
  getX87StackRegIndex,
  X87_STACK_REGS_COUNT,
  type X87StackRegName,
} from '@ts-c-compiler/x86-assembler';

import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { X86CompileInstructionOutput } from '../../compilers/shared/X86CompileInstructionOutput';
import { genInstruction } from 'arch/x86/asm-utils';
import { X86Allocator } from '../../X86Allocator';

export type X87OwnershipStackEntry = {
  reg: X87StackRegName;
  size: number;
  varName?: string;
  canBeErased?: boolean;
};

export class X87RegOwnershipTracker {
  private readonly stackOwnership: X87OwnershipStackEntry[] = [];

  private stackPointer: number = 0;

  constructor(private readonly allocator: X86Allocator) {}

  get lifetime() {
    return this.allocator.lifetime;
  }

  get stackTopRegName() {
    return createX87StackRegByIndex(this.stackPointer);
  }

  getStack() {
    return this.stackOwnership;
  }

  getOwnershipIndexFromStackReg(reg: X87StackRegName) {
    return wrapAround(
      X87_STACK_REGS_COUNT,
      this.stackPointer - getX87StackRegIndex(reg),
    );
  }

  getStackVar(name: string) {
    return this.stackOwnership.find(entry => entry?.varName === name);
  }

  setOwnership(entry: X87OwnershipStackEntry) {
    const offset = this.getOwnershipIndexFromStackReg(entry.reg);

    this.stackOwnership[offset] = entry;
  }

  markEntryAsReadyToErase(entry: X87OwnershipStackEntry) {
    const { stackOwnership } = this;

    stackOwnership[stackOwnership.indexOf(entry)].canBeErased = true;
  }

  markRegAsReadyToErase(reg: X87StackRegName) {
    const offset = this.getOwnershipIndexFromStackReg(reg);

    this.stackOwnership[offset].canBeErased = true;
  }

  markRegsAsReadyToErase(regs: X87StackRegName[]) {
    for (const reg of regs) {
      this.markRegAsReadyToErase(reg);
    }
  }

  push(entry: X87OwnershipStackEntry) {
    const { stackOwnership } = this;
    const asm = new X86CompileInstructionOutput();

    this.stackPointer = (this.stackPointer + 1) % X87_STACK_REGS_COUNT;

    const prevValue = stackOwnership[this.stackPointer];

    if (prevValue) {
      this.markUnusedAsReadyToErase();

      if (prevValue.canBeErased) {
        asm.appendInstructions(genInstruction('ffree', prevValue.reg));
      } else {
        throw new CBackendError(CBackendErrorCode.CANNOT_OVERRIDE_X87_STACK);
      }
    }

    stackOwnership[this.stackPointer] = entry;
    this.adjustOwnershipRegsNames();

    return asm;
  }

  swapWithStackTop(reg: X87StackRegName) {
    const { stackOwnership } = this;
    const regIndex = this.getOwnershipIndexFromStackReg(reg);

    [stackOwnership[regIndex], stackOwnership[this.stackPointer]] = [
      stackOwnership[this.stackPointer],
      stackOwnership[regIndex],
    ];

    this.adjustOwnershipRegsNames();

    return X86CompileInstructionOutput.ofInstructions([
      genInstruction('fxch', reg),
    ]);
  }

  private markUnusedAsReadyToErase() {
    const { stackOwnership, lifetime, allocator } = this;

    for (const ownership of stackOwnership) {
      if (!ownership?.varName) {
        continue;
      }

      if (
        !ownership.canBeErased &&
        !lifetime.isVariableLaterUsed(
          allocator.iterator.offset,
          ownership.varName,
        )
      ) {
        ownership.canBeErased = true;
      }
    }
  }

  private adjustOwnershipRegsNames() {
    for (let i = 0; i < X87_STACK_REGS_COUNT; ++i) {
      const ownership = this.stackOwnership[i];

      if (!ownership) {
        continue;
      }

      const distance = i - this.stackPointer;
      ownership.reg = createX87StackRegByIndex(
        distance <= 0 ? -distance : X87_STACK_REGS_COUNT - distance,
      );
    }
  }
}

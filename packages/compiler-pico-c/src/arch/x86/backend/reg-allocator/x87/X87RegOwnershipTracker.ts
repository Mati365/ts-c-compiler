import * as R from 'ramda';

import { wrapAround } from '@ts-c-compiler/core';
import {
  createX87StackRegByIndex,
  getX87StackRegIndex,
  X87_STACK_REGISTERS,
  X87_STACK_REGS_COUNT,
  type X87StackRegName,
} from '@ts-c-compiler/x86-assembler';

import { X86CompileInstructionOutput } from '../../compilers/shared/X86CompileInstructionOutput';
import { genInstruction } from 'arch/x86/asm-utils';
import { X86Allocator } from '../../X86Allocator';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

export type X87OwnershipStackEntry = {
  reg: X87StackRegName;
  size: number;
  varName?: string;
  canBeErased?: boolean;
};

export class X87RegOwnershipTracker {
  private stackOwnership: X87OwnershipStackEntry[] = [];

  private stackPointer: number = 0;

  constructor(private readonly allocator: X86Allocator) {}

  get lifetime() {
    return this.allocator.lifetime;
  }

  get stackTopRegName() {
    return createX87StackRegByIndex(this.stackPointer);
  }

  get topStackEntry() {
    return this.stackOwnership[this.stackPointer];
  }

  toString() {
    return X87_STACK_REGISTERS.map(
      (_, index) =>
        `fp${index}:${
          index === this.stackPointer ? '<--' : ''
        } ${JSON.stringify(this.stackOwnership[index] ?? '<blank>')}`,
    ).join('\n');
  }

  getStack() {
    return this.stackOwnership;
  }

  getRegByStackIndex(index: number) {
    if (this.stackPointer > index) {
      return createX87StackRegByIndex(
        X87_STACK_REGS_COUNT - this.stackPointer + index,
      );
    }

    return createX87StackRegByIndex(index - this.stackPointer);
  }

  getOwnershipIndexFromStackReg(reg: X87StackRegName) {
    return wrapAround(
      X87_STACK_REGS_COUNT,
      this.stackPointer + getX87StackRegIndex(reg),
    );
  }

  removeStackEntry(entry: X87OwnershipStackEntry) {
    this.stackOwnership = R.without([entry], this.stackOwnership);
    this.adjustOwnershipRegsNames();
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

  pop() {
    this.stackOwnership[this.stackPointer] = null;
    this.stackPointer = wrapAround(X87_STACK_REGS_COUNT, this.stackPointer + 1);

    this.adjustOwnershipRegsNames();
  }

  push(entry: X87OwnershipStackEntry) {
    const { stackOwnership } = this;

    const newStackPointer = wrapAround(
      X87_STACK_REGS_COUNT,
      this.stackPointer - 1,
    );
    const prevEntry = stackOwnership[newStackPointer];
    const asm = new X86CompileInstructionOutput();

    if (prevEntry) {
      this.markUnusedAsReadyToErase();

      if (prevEntry.canBeErased) {
        asm.appendInstructions(genInstruction('ffree', 'st7'));
      } else {
        const realignResult = this.tryRealignLastToFirstEmpty();

        if (!realignResult) {
          throw new CBackendError(CBackendErrorCode.CANNOT_OVERRIDE_X87_STACK);
        }

        asm.appendGroup(realignResult);
        asm.appendInstructions(genInstruction('ffree', 'st7'));
      }
    }

    this.stackPointer = newStackPointer;
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

  vacuumNotUsed() {
    const asm = new X86CompileInstructionOutput();
    const newStackOwnership: X87OwnershipStackEntry[] = [];

    this.markUnusedAsReadyToErase();

    for (const entry of this.stackOwnership) {
      if (entry?.canBeErased) {
        asm.appendInstructions(genInstruction('ffree', entry.reg));
        newStackOwnership.push(null);
      } else {
        newStackOwnership.push(entry);
      }
    }

    this.stackOwnership = newStackOwnership;
    return asm;
  }

  private tryRealignLastToFirstEmpty() {
    const asm = new X86CompileInstructionOutput();
    const freeStackIndex = this.findFirstEmptyStackIndex();

    if (freeStackIndex !== null) {
      const freeReg = this.getRegByStackIndex(freeStackIndex);

      asm.appendGroups(
        this.swapWithStackTop('st7'),
        this.swapWithStackTop(freeReg),
        this.swapWithStackTop('st7'),
      );

      return asm;
    }

    return null;
  }

  private findFirstEmptyStackIndex() {
    const { stackOwnership } = this;

    for (let i = 0; i < stackOwnership.length; ++i) {
      const ownership = stackOwnership[i];

      if (!ownership || ownership.canBeErased) {
        return i;
      }
    }

    return null;
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
    for (
      let i = 0, offset = this.stackPointer;
      i < X87_STACK_REGS_COUNT;
      ++i, ++offset
    ) {
      const roundedOffset = wrapAround(X87_STACK_REGS_COUNT, offset);
      const ownership = this.stackOwnership[roundedOffset];

      if (!ownership) {
        continue;
      }

      ownership.reg = createX87StackRegByIndex(
        wrapAround(X87_STACK_REGS_COUNT, offset - this.stackPointer),
      );
    }
  }
}

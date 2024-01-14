import {
  createX87StackRegByIndex,
  getX87StackRegIndex,
  X87_STACK_REGS_COUNT,
  type X87StackRegName,
} from '@ts-c-compiler/x86-assembler';

import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { X86CompileInstructionOutput } from '../../compilers/shared/X86CompileInstructionOutput';
import { genInstruction } from 'arch/x86/asm-utils';
import { X86VarLifetimeGraph } from '../X86VarLifetimeGraph';
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

  constructor(
    private readonly lifetime: X86VarLifetimeGraph,
    private readonly allocator: X86Allocator,
  ) {}

  get stackTopRegName() {
    return createX87StackRegByIndex(this.stackPointer);
  }

  getStack() {
    return this.stackOwnership;
  }

  getOwnershipIndexFromStackReg(reg: X87StackRegName) {
    return (
      (this.stackPointer - getX87StackRegIndex(reg) - 1) % X87_STACK_REGS_COUNT
    );
  }

  getStackVar(name: string) {
    return this.stackOwnership.find(entry => entry.varName === name);
  }

  setOwnership(entry: X87OwnershipStackEntry) {
    const offset = this.getOwnershipIndexFromStackReg(entry.reg);

    this.stackOwnership[offset] = entry;
  }

  markAsReadyToErase(reg: X87StackRegName) {
    const offset = this.getOwnershipIndexFromStackReg(reg);

    this.stackOwnership[offset].canBeErased = true;
  }

  push(entry: X87OwnershipStackEntry) {
    const { stackPointer, stackOwnership } = this;

    const asm = new X86CompileInstructionOutput();
    const prevValue = stackOwnership[stackPointer];

    if (prevValue) {
      this.markUnusedAsReadyToErase();

      if (!prevValue.canBeErased) {
        throw new CBackendError(CBackendErrorCode.CANNOT_OVERRIDE_X87_STACK);
      }

      asm.appendInstructions(genInstruction('ffree', this.stackTopRegName));
    }

    stackOwnership[stackPointer] = entry;

    this.adjustOwnershipRegsNames();
    this.stackPointer = (this.stackPointer + 1) % X87_STACK_REGS_COUNT;

    return asm;
  }

  swapWithStackTop(reg: X87StackRegName) {
    const { stackOwnership } = this;
    const regIndex = this.getOwnershipIndexFromStackReg(reg);

    [stackOwnership[regIndex], stackOwnership[this.stackPointer - 1]] = [
      stackOwnership[this.stackPointer - 1],
      stackOwnership[regIndex],
    ];

    this.adjustOwnershipRegsNames();

    return X86CompileInstructionOutput.ofInstructions([
      genInstruction('fxch', createX87StackRegByIndex(regIndex)),
    ]);
  }

  markUnusedAsReadyToErase() {
    const { stackOwnership, lifetime, allocator } = this;

    for (const ownership of stackOwnership) {
      if (!ownership?.varName) {
        continue;
      }

      if (
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

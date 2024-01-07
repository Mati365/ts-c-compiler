import {
  X87StackRegName,
  X87_STACK_REGS_COUNT,
} from '@ts-c-compiler/x86-assembler';

import {
  IRConstant,
  IRInstructionTypedArg,
  isIRConstant,
  isIRVariable,
} from 'frontend/ir/variables';

import { X86CompileInstructionOutput } from '../../compilers/shared/X86CompileInstructionOutput';
import { X86Allocator } from '../../X86Allocator';
import {
  genDefConst,
  genInstruction,
  genLabeledInstruction,
  genMemAddress,
} from 'arch/x86/asm-utils';

import { createX86RegsMap } from 'arch/x86/constants/regs';
import { X86StackFrame, X86StackVariable } from '../../X86StackFrame';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

type X87StoreConstantAttrs = {
  value: IRConstant;
  address: string;
};

type X87OwnershipStackEntry = {
  size: number;
  varName?: string;
};

type X87SpilledOwnershipStackEntry = {
  entry: X87OwnershipStackEntry;
  stackVar: X86StackVariable;
};

type X87PushIrArgOnStackAttrs = {
  arg: IRInstructionTypedArg;
  onTopOfStack?: boolean;
};

type X87PushIRArgOnStackResult = {
  asm: X86CompileInstructionOutput;
  reg: X87StackRegName;
};

export class X87BasicRegAllocator {
  private readonly stackOwnership: X87OwnershipStackEntry[] = [];

  private readonly spilledStackOwnership: X87SpilledOwnershipStackEntry[] = [];

  private readonly stackRegsMap =
    createX86RegsMap()[this.config.arch].float.x87;

  constructor(private readonly allocator: X86Allocator) {}

  private get config() {
    return this.allocator.config;
  }

  private get stackFrame() {
    return this.allocator.stackFrame;
  }

  private isStackFull() {
    return this.stackOwnership.length === X87_STACK_REGS_COUNT;
  }

  pushIRArgOnStack({
    arg,
  }: X87PushIrArgOnStackAttrs): X87PushIRArgOnStackResult {
    const { allocator } = this;

    const asm = new X86CompileInstructionOutput();
    const size = arg.type.getByteSize();

    if (isIRConstant(arg)) {
      const constLabel = allocator.labelsResolver.genUniqLabel();

      this.pushVariableOnStack({
        size: arg.type.getByteSize(),
      });

      asm.appendInstructions(
        genInstruction('fld', genMemAddress({ size, expression: constLabel })),
      );

      asm.appendData(
        genLabeledInstruction(constLabel, genDefConst(size, [arg.constant])),
      );

      return {
        reg: 'st0',
        asm,
      };
    }

    if (isIRVariable(arg)) {
      console.info(arg);
    }

    throw new CBackendError(CBackendErrorCode.UNABLE_PUSH_ARG_ON_X87_STACK);
  }

  storeConstantAtAddress({ value, address }: X87StoreConstantAttrs) {
    const { allocator } = this;

    const constLabel = allocator.labelsResolver.genUniqLabel();
    const size = value.type.getByteSize();
    const isExhausted = this.isStackFull();
    const asm = new X86CompileInstructionOutput();

    this.pushVariableOnStack({
      size: value.type.getByteSize(),
    });

    if (isExhausted) {
      asm.appendGroup(this.spillLast());
    }

    asm.appendInstructions(
      genInstruction('fld', genMemAddress({ size, expression: constLabel })),
      genInstruction('fstp', address),
    );

    asm.appendData(
      genLabeledInstruction(constLabel, genDefConst(size, [value.constant])),
    );

    this.popVariableFromStack();

    if (isExhausted) {
      this.revertLastSpilled();
    }

    return asm;
  }

  private swapWithStackTop(index: number) {
    const { stackRegsMap, stackOwnership } = this;

    [stackOwnership[index], stackOwnership[0]] = [
      stackOwnership[0],
      stackOwnership[index],
    ];

    return {
      asm: X86CompileInstructionOutput.ofInstructions([
        genInstruction('fxchg', stackRegsMap.stack[index]),
      ]),
    };
  }

  private popVariableFromStack() {
    return this.stackOwnership.shift();
  }

  private pushVariableOnStack(entry: X87OwnershipStackEntry) {
    if (this.isStackFull()) {
      this.spillLast();
    }

    this.stackOwnership.unshift(entry);
  }

  private spillLast() {
    const lastOwnership = this.stackOwnership.pop();
    const spilledStackVar = this.stackFrame.allocSpillVariable(
      lastOwnership.size,
    );
    const asm = new X86CompileInstructionOutput();

    this.swapWithStackTop(X87_STACK_REGS_COUNT - 1);
    asm.appendInstructions(
      genInstruction(
        'fstp',
        X86StackFrame.getStackVarRelAddress(spilledStackVar),
      ),
    );

    this.spilledStackOwnership.push({
      entry: this.stackOwnership.shift(),
      stackVar: spilledStackVar,
    });

    return asm;
  }

  private revertLastSpilled() {
    const lastSpilled = this.spilledStackOwnership.pop();

    this.pushVariableOnStack(lastSpilled.entry);
  }
}

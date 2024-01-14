import { X87StackRegName } from '@ts-c-compiler/x86-assembler';

import type { CType } from 'frontend/analyze';
import type { X86VarLifetimeGraph } from '../X86VarLifetimeGraph';

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

import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';
import {
  X87OwnershipStackEntry,
  X87RegOwnershipTracker,
} from './X87RegOwnershipTracker';

type X87StoreConstantAttrs = {
  value: IRConstant;
  address: string;
};

type X87StoreStackRegAttrs = {
  reg: X87StackRegName;
  address: string;
};

type X87PushIrArgOnStackAttrs = {
  arg: IRInstructionTypedArg;
  castedType?: CType;
  stackIndex?: number;
};

type X87IRArgStackResult = {
  asm: X86CompileInstructionOutput;
  entry: X87OwnershipStackEntry;
};

export class X87BasicRegAllocator {
  readonly tracker: X87RegOwnershipTracker;

  constructor(
    lifetime: X86VarLifetimeGraph,
    private readonly allocator: X86Allocator,
  ) {
    this.tracker = new X87RegOwnershipTracker(lifetime, allocator);
  }

  private get stackFrame() {
    return this.allocator.stackFrame;
  }

  pushIRArgOnStack({
    arg,
    castedType = arg.type,
  }: X87PushIrArgOnStackAttrs): X87IRArgStackResult {
    const { allocator } = this;

    const asm = new X86CompileInstructionOutput();
    const size = castedType.getByteSize();

    if (isIRConstant(arg)) {
      const constLabel = allocator.labelsResolver.genUniqLabel();
      const pushResult = this.pushVariableOnStack({
        size,
      });

      asm.appendGroup(pushResult.asm);
      asm.appendInstructions(
        genInstruction('fld', genMemAddress({ size, expression: constLabel })),
      );

      asm.appendData(
        genLabeledInstruction(
          constLabel,
          genDefConst({ size, values: [arg.constant], float: true }),
        ),
      );

      return {
        entry: pushResult.entry,
        asm,
      };
    }

    if (isIRVariable(arg)) {
      const pushResult = this.pushVariableOnStack({
        varName: arg.name,
        size: arg.type.getByteSize(),
      });

      if (!arg.isTemporary()) {
        const stackAddress = this.stackFrame.getLocalVarStackRelAddress(
          arg.name,
          {
            withSize: true,
          },
        );

        asm.appendInstructions(genInstruction('fld', stackAddress));
      }

      asm.appendGroup(pushResult.asm);

      return {
        entry: pushResult.entry,
        asm,
      };
    }

    throw new CBackendError(CBackendErrorCode.UNABLE_PUSH_ARG_ON_X87_STACK);
  }

  storeStackRegAtAddress({ reg, address }: X87StoreStackRegAttrs) {
    const asm = new X86CompileInstructionOutput();

    if (reg !== 'st0') {
      asm.appendGroup(this.tracker.swapWithStackTop(reg));
    }

    asm.appendInstructions(genInstruction('fst', address));
    this.tracker.markUnusedAsReadyToErase();

    return {
      asm,
    };
  }

  storeConstantAtAddress({ value, address }: X87StoreConstantAttrs) {
    const { allocator, tracker } = this;
    const asm = new X86CompileInstructionOutput();

    const constLabel = allocator.labelsResolver.genUniqLabel();
    const size = value.type.getByteSize();

    const pushResult = this.pushVariableOnStack({
      size: value.type.getByteSize(),
    });

    asm.appendGroup(pushResult.asm);
    asm.appendInstructions(
      genInstruction('fld', genMemAddress({ size, expression: constLabel })),
      genInstruction('fstp', address),
    );

    asm.appendData(
      genLabeledInstruction(
        constLabel,
        genDefConst({ size, values: [value.constant], float: true }),
      ),
    );

    tracker.markAsReadyToErase(pushResult.entry.reg);
    return asm;
  }

  private pushVariableOnStack(entry: Omit<X87OwnershipStackEntry, 'reg'>) {
    const { tracker } = this;

    const asm = new X86CompileInstructionOutput();
    const pushedEntry: X87OwnershipStackEntry = {
      ...entry,
      reg: 'st0',
    };

    asm.appendGroup(tracker.push(pushedEntry));

    return {
      entry: pushedEntry,
      asm,
    };
  }
}

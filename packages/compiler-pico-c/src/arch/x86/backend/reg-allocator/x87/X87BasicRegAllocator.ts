import { X87StackRegName } from '@ts-c-compiler/x86-assembler';

import { isPrimitiveLikeType, type CType } from 'frontend/analyze';
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
  pop?: boolean;
  integral?: boolean;
};

type X87PushIrArgOnStackAttrs = {
  arg: IRInstructionTypedArg;
  castedType?: CType;
};

type X87PushIrArgAsMemAttrs = {
  arg: IRInstructionTypedArg;
  castedType?: CType;
};

type X87ResolveIrArgOnStackAttrs = X87PushIrArgOnStackAttrs & {
  stackTop?: boolean;
  ignoreCache?: boolean;
  allowCast?: boolean;
};

type X87IRArgStackResult = {
  asm: X86CompileInstructionOutput;
  entry: X87OwnershipStackEntry;
};

type X87IRArgMemResult = {
  asm: X86CompileInstructionOutput;
  address: string;
};

export const isX87IRArgMemResult = (result: any): result is X87IRArgMemResult =>
  !!result && 'address' in result;

export class X87BasicRegAllocator {
  readonly tracker: X87RegOwnershipTracker;

  constructor(private readonly allocator: X86Allocator) {
    this.tracker = new X87RegOwnershipTracker(allocator);
  }

  private get x86Regs() {
    return this.allocator.regs;
  }

  private get memOwnership() {
    return this.allocator.memOwnership;
  }

  private get stackFrame() {
    return this.allocator.stackFrame;
  }

  tryResolveIrArgAsRegOrMem(attrs: X87ResolveIrArgOnStackAttrs) {
    const { arg } = attrs;

    if (!isIRConstant(arg) || (arg.constant !== 0 && arg.constant !== 1)) {
      const memResult = this.tryResolveIrArgAsMem(attrs);

      if (memResult) {
        return {
          ...memResult,
          value: memResult.address,
        };
      }
    }

    const regResult = this.tryResolveIRArgAsReg(attrs);
    if (regResult) {
      return {
        ...regResult,
        get value() {
          return regResult.entry.reg;
        },
      };
    }

    throw new CBackendError(CBackendErrorCode.UNABLE_TO_RESOLVE_X87_ARG);
  }

  tryResolveIrArgAsMem({
    arg,
    castedType = arg.type,
  }: X87PushIrArgAsMemAttrs): X87IRArgMemResult {
    const { allocator } = this;
    const size = castedType.getByteSize();

    if (isIRConstant(arg)) {
      const constLabel = allocator.labelsResolver.genUniqLabel();
      const asm = new X86CompileInstructionOutput();

      asm.appendData(
        genLabeledInstruction(
          constLabel,
          genDefConst({ size, values: [arg.constant], float: true }),
        ),
      );

      return {
        asm,
        address: genMemAddress({ size, expression: constLabel }),
      };
    }

    if (isIRVariable(arg) && !arg.isTemporary()) {
      const stackAddress = this.stackFrame.getLocalVarStackRelAddress(
        arg.name,
        {
          withSize: true,
        },
      );

      return {
        asm: X86CompileInstructionOutput.ofInstructions([]),
        address: stackAddress,
      };
    }

    return null;
  }

  tryResolveIRArgAsReg({
    stackTop,
    ignoreCache,
    allowCast,
    ...attrs
  }: X87ResolveIrArgOnStackAttrs): X87IRArgStackResult {
    const { tracker } = this;
    const { arg } = attrs;

    const result = (() => {
      if (isIRConstant(arg)) {
        return this.pushIRArgOnStack(attrs);
      }

      if (isIRVariable(arg)) {
        if (isPrimitiveLikeType(arg.type, true) && arg.type.isIntegral()) {
          if (!allowCast) {
            throw new CBackendError(CBackendErrorCode.VARIABLE_MUST_BE_FLOAT);
          }

          return this.tryResolveIRIntArgAsReg(attrs);
        }

        const stackVar = ignoreCache ? null : tracker.getStackVar(arg.name);

        if (!stackVar) {
          return this.pushIRArgOnStack(attrs);
        }

        return {
          asm: X86CompileInstructionOutput.ofInstructions([]),
          entry: stackVar,
        } as X87IRArgStackResult;
      }

      return null;
    })();

    if (!result) {
      return null;
    }

    if (stackTop && result.entry.reg !== 'st0') {
      result.asm.appendGroup(this.tracker.swapWithStackTop(result.entry.reg));
    }

    return result;
  }

  private tryResolveIRIntArgAsReg({
    arg,
    castedType = arg.type,
  }: X87ResolveIrArgOnStackAttrs): X87IRArgStackResult {
    const { memOwnership, stackFrame, x86Regs } = this;
    const size = castedType.getByteSize();
    const asm = new X86CompileInstructionOutput();

    if (!isIRVariable(arg)) {
      throw new CBackendError(CBackendErrorCode.CANNOT_CAST_X87_ARG);
    }

    let memAddr = memOwnership.tryResolveIRArgAsAddr(arg)?.value;
    if (!memAddr) {
      const spillVar = stackFrame.allocSpillVariable(arg.type.getByteSize());
      const regOwnership = x86Regs.tryResolveIRArgAsReg({
        arg,
      });

      memAddr = stackFrame.getLocalVarStackRelAddress(spillVar.name, {
        withSize: true,
      });

      asm.appendInstructions(
        genInstruction('mov', memAddr, regOwnership.value),
      );
    }

    const pushResult = this.pushVariableOnStack({
      size,
    });

    asm.appendGroup(pushResult.asm);
    asm.appendInstructions(genInstruction('fild', memAddr));

    return {
      asm,
      entry: pushResult.entry,
    };
  }

  pushIRArgOnStack({
    arg,
    castedType = arg.type,
  }: X87PushIrArgOnStackAttrs): X87IRArgStackResult {
    const { allocator } = this;

    const asm = new X86CompileInstructionOutput();
    const size = castedType.getByteSize();

    if (isIRConstant(arg)) {
      const pushResult = this.pushVariableOnStack({
        size,
      });

      asm.appendGroup(pushResult.asm);

      // use smarter fld1 if value == 1
      switch (arg.constant) {
        case 0x1:
          asm.appendInstructions(genInstruction('fld1'));
          break;

        case 0x0:
          asm.appendInstructions(genInstruction('fldz'));
          break;

        default: {
          const constLabel = allocator.labelsResolver.genUniqLabel();

          asm.appendInstructions(
            genInstruction(
              'fld',
              genMemAddress({ size, expression: constLabel }),
            ),
          );

          asm.appendData(
            genLabeledInstruction(
              constLabel,
              genDefConst({ size, values: [arg.constant], float: true }),
            ),
          );
        }
      }

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

      asm.appendGroup(pushResult.asm);

      if (arg.isTemporary()) {
        const memAddr = this.memOwnership.tryResolveIRArgAsAddr(arg);
        if (!memAddr) {
          throw new CBackendError(
            CBackendErrorCode.UNABLE_PUSH_ARG_ON_X87_STACK,
          );
        }

        asm.appendInstructions(genInstruction('fld', memAddr.value));
      } else {
        const stackAddress = this.stackFrame.getLocalVarStackRelAddress(
          arg.name,
          {
            withSize: true,
          },
        );

        asm.appendInstructions(genInstruction('fld', stackAddress));
      }

      return {
        entry: pushResult.entry,
        asm,
      };
    }

    throw new CBackendError(CBackendErrorCode.UNABLE_PUSH_ARG_ON_X87_STACK);
  }

  storeStackRegAtAddress({
    reg,
    address,
    pop,
    integral,
  }: X87StoreStackRegAttrs) {
    const asm = new X86CompileInstructionOutput();

    if (reg !== 'st0') {
      asm.appendGroup(this.tracker.swapWithStackTop(reg));
    }

    const instruction = (() => {
      if (integral) {
        return pop ? 'fistp' : 'fist';
      }

      return pop ? 'fstp' : 'fst';
    })();

    asm.appendInstructions(genInstruction(instruction, address));

    if (pop) {
      this.tracker.afterPop();
    }

    return {
      asm,
    };
  }

  storeConstantAtAddress({ value, address }: X87StoreConstantAttrs) {
    const { allocator } = this;
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

    this.tracker.afterPop();
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

import { IRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { X86RegName } from '@x86-toolkit/assembler/index';

import { genInstruction } from '../../asm-utils';
import { getX86RegByteSize } from '../../constants/regs';

import { compileMemcpy } from '../compilers/shared';
import { getStoreOutputByteSize } from '../utils';

import { X86Allocator } from '../X86Allocator';
import { X86StackFrame } from '../X86StackFrame';
import {
  X86ConventionalFnCaller,
  X86FnBasicCompilerAttrs,
  X86FnCallerCompilerAttrs,
  X86FnRetCompilerAttrs,
} from './X86ConventionalFnCaller';

export class X86StdcallFnCaller implements X86ConventionalFnCaller {
  /**
   * Compiles `call` opcode and pushes args
   */
  compileIRFnCall({
    context,
    target,
    callerInstruction,
  }: X86FnCallerCompilerAttrs): string[] {
    const { allocator } = context;
    const { declaration } = target;
    const { regs } = allocator;

    const stack = this.getContextStackInfo(allocator);
    const totalNonRVOArgs = callerInstruction.args.length;
    const asm: string[] = [];

    // call function section
    for (let i = totalNonRVOArgs - 1; i >= 0; --i) {
      const resolvedArg = allocator.regs.tryResolveIrArg({
        arg: callerInstruction.args[i],
        size: stack.size,
      });

      asm.push(...resolvedArg.asm, genInstruction('push', resolvedArg.value));
    }

    asm.push(genInstruction('call', target.asm.label));

    // restore result from register (AX is already loaded in `compileIRFnRet`)
    if (
      callerInstruction.outputVar &&
      !declaration.isVoid() &&
      declaration.hasReturnValue()
    ) {
      regs.ownership.setOwnership(callerInstruction.outputVar.name, {
        reg: this.getReturnReg(allocator),
      });
    }

    // handle case when we call `sum(void)` with `sum(1, 2, 3)`.
    // Cleanup `1`, .. args stack because `ret` function does not do that
    const argsCountDelta =
      totalNonRVOArgs - declaration.getArgsWithRVO().length;

    if (argsCountDelta) {
      asm.push(genInstruction('add', stack.reg, argsCountDelta * stack.size));
    }

    return asm;
  }

  /**
   * Reads all args in `def` instruction
   */
  allocIRFnDefArgs({ context, declaration }: X86FnBasicCompilerAttrs) {
    const { allocator } = context;
    const { stackFrame, regs } = allocator;

    const stack = this.getContextStackInfo(allocator);
    const args = declaration.getArgsWithRVO();

    for (let i = args.length - 1; i >= 0; --i) {
      const arg = args[i];
      const stackVar = stackFrame.allocRawStackVariable({
        name: arg.name,
        offset: (i + 2) * stack.size,
        size: X86StackFrame.getStackAllocVariableSize(arg),
      });

      regs.ownership.setOwnership(arg.name, {
        stackVar,
      });
    }
  }

  /**
   * Returns `ret` instruction opcode and assigns ownership on reg
   */
  compileIRFnRet({
    context,
    declaration,
    retInstruction,
  }: X86FnRetCompilerAttrs): string[] {
    const { allocator } = context;

    const stack = this.getContextStackInfo(allocator);
    const totalArgs = declaration.getArgsWithRVO().length;
    const asm: string[] = [];

    if (!declaration.isVoid() && retInstruction.value) {
      if (declaration.hasRVO()) {
        // copy structure A to B
        asm.push(
          ...compileMemcpy({
            context,
            outputVar: declaration.getRVOOutputVar(),
            inputVar: retInstruction.value as IRVariable,
          }),
        );
      } else if (declaration.hasReturnValue()) {
        // handle case when we call `return 2`
        const retResolvedArg = allocator.regs.tryResolveIRArgAsReg({
          size: getStoreOutputByteSize(declaration.returnType, 0),
          arg: retInstruction.value,
          allowedRegs: [this.getReturnReg(allocator)],
        });

        asm.push(...retResolvedArg.asm);
      }
    }

    asm.push(genInstruction('pop', 'bp'));

    if (totalArgs) {
      asm.push(genInstruction('ret', totalArgs * stack.size));
    } else {
      asm.push(genInstruction('ret'));
    }

    return asm;
  }

  private getReturnReg(allocator: X86Allocator): X86RegName {
    return allocator.regs.ownership.getAvailableRegs().general.list[0];
  }

  private getContextStackInfo(allocator: X86Allocator) {
    const reg = allocator.regs.ownership.getAvailableRegs().stack;
    const size = getX86RegByteSize(reg);

    return {
      reg,
      size,
    };
  }
}

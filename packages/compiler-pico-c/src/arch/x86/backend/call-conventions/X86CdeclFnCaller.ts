import { genInstruction } from '../../asm-utils';
import { getX86RegByteSize } from '../../constants/regs';
import { X86BackendCompilerContext } from '../../constants/types';
import { X86StackFrame } from '../X86StackFrame';
import {
  X86ConventionalFnCaller,
  X86FnCallerCompilerAttrs,
  X86FnDefStackArgsCompilerAttrs,
} from './X86ConventionalFnCaller';

export class X86CdeclFnCaller implements X86ConventionalFnCaller {
  compileIRFnCall({
    context,
    target,
    callerInstruction,
  }: X86FnCallerCompilerAttrs): string[] {
    const { allocator } = context;

    const stack = this.getContextStackInfo(context);
    const totalArgs = callerInstruction.args.length;
    const asm: string[] = [];

    // alloc args
    for (let i = totalArgs - 1; i >= 0; --i) {
      const resolvedArg = allocator.regs.tryResolveIrArg({
        arg: callerInstruction.args[i],
        size: stack.size,
      });

      asm.push(...resolvedArg.asm, genInstruction('push', resolvedArg.value));
    }

    // call and cleanup
    asm.push(
      genInstruction('call', target.asm.label),
      genInstruction('add', stack.reg, totalArgs * stack.size),
    );

    return asm;
  }

  allocIRFnDefStackArgs({
    context,
    declaration,
  }: X86FnDefStackArgsCompilerAttrs) {
    const { stackFrame, regs } = context.allocator;
    const { args } = declaration;
    const stack = this.getContextStackInfo(context);

    for (let i = args.length - 1; i >= 0; --i) {
      const arg = args[i];
      const stackVar = stackFrame.allocRawStackVariable({
        name: arg.name,
        offset: (args.length - i) * stack.size,
        size: X86StackFrame.getStackAllocVariableSize(arg),
      });

      regs.ownership.setOwnership(arg.name, {
        stackVar,
      });
    }
  }

  private getContextStackInfo({ allocator }: X86BackendCompilerContext) {
    const reg = allocator.regs.ownership.getAvailableRegs().stack;
    const size = getX86RegByteSize(reg);

    return {
      reg,
      size,
    };
  }
}

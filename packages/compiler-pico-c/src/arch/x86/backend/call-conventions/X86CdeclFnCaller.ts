import { genInstruction } from '../../asm-utils';
import {
  X86ConventionalFnCaller,
  X86FnCallerCompilerAttrs,
} from './X86ConventionalFnCaller';

export class X86CdeclFnCaller implements X86ConventionalFnCaller {
  compileIRFnCall({
    context,
    target,
    callerInstruction,
  }: X86FnCallerCompilerAttrs): string[] {
    const { allocator } = context;
    const regs = allocator.regs.ownership.getAvailableRegs();

    const stackSize = regs.general.size;
    const stackReg = regs.stack;

    const totalArgs = callerInstruction.args.length;
    const asm: string[] = [];

    // alloc args
    for (let i = totalArgs - 1; i >= 0; --i) {
      const resolvedArg = allocator.regs.tryResolveIrArg({
        arg: callerInstruction.args[i],
        size: stackSize,
      });

      asm.push(...resolvedArg.asm, genInstruction('push', resolvedArg.value));
    }

    // call
    asm.push(genInstruction('call', target.asm.label));

    // cleanup
    asm.push(genInstruction('add', stackReg, totalArgs * stackSize));
    return asm;
  }
}

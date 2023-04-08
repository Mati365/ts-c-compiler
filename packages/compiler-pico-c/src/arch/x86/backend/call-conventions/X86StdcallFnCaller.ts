import chalk from 'chalk';

import { CFunctionCallConvention } from '@compiler/pico-c/constants';
import { IRVariable } from '@compiler/pico-c/frontend/ir/variables';

import { getBaseTypeIfPtr } from '@compiler/pico-c/frontend/analyze/types/utils';
import { getTypeOffsetByteSize } from '@compiler/pico-c/frontend/ir/utils';
import { genInstruction, withInlineComment } from '../../asm-utils';
import { getX86RegByteSize } from '../../constants/regs';

import { compileMemcpy } from '../compilers/shared';
import { isRegOwnership } from '../reg-allocator/utils';

import { X86Allocator } from '../X86Allocator';
import {
  X86ConventionalFnCaller,
  X86FnBasicCompilerAttrs,
  X86FnCallerCompilerAttrs,
  X86FnRetCompilerAttrs,
} from './X86ConventionalFnCaller';

export class X86StdcallFnCaller implements X86ConventionalFnCaller {
  protected readonly convention = CFunctionCallConvention.STDCALL;

  /**
   * Compiles `call` opcode and pushes args
   *
   * @todo
   *  Add preserving registers algorithm!
   */
  compileIRFnCall({
    address,
    declInstruction,
    context,
    callerInstruction,
  }: X86FnCallerCompilerAttrs): string[] {
    const { allocator } = context;
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

    asm.push(genInstruction('call', address));

    // do not reorder! it must be called before `getReturnReg` setOwnership!
    const preservedRegs = this.preserveConventionRegsAsm({
      context,
      declInstruction,
    });

    // restore result from register (AX is already loaded in `compileIRFnRet`)
    if (
      callerInstruction.outputVar &&
      !declInstruction.isVoid() &&
      declInstruction.hasReturnValue()
    ) {
      regs.ownership.setOwnership(callerInstruction.outputVar.name, {
        reg: this.getReturnReg({
          context,
          declInstruction,
        }),
      });
    }

    // handle case when we call `sum(void)` with `sum(1, 2, 3)`.
    // Cleanup `1`, .. args stack because `ret` function does not do that
    const argsCountDelta =
      totalNonRVOArgs - declInstruction.getArgsWithRVO().length;

    if (argsCountDelta) {
      asm.push(genInstruction('add', stack.reg, argsCountDelta * stack.size));
    }

    return [...preservedRegs.preserve, ...asm, ...preservedRegs.restore];
  }

  /**
   * Reads all args in `def` instruction
   */
  allocIRFnDefArgs({ context, declInstruction }: X86FnBasicCompilerAttrs) {
    const { allocator } = context;
    const { stackFrame, regs } = allocator;

    const stack = this.getContextStackInfo(allocator);
    const args = declInstruction.getArgsWithRVO();

    for (let i = args.length - 1; i >= 0; --i) {
      const arg = args[i];
      const argAllocSize = getBaseTypeIfPtr(arg.type).getByteSize();

      const stackVar = stackFrame.allocRawStackVariable({
        name: arg.name,
        size: argAllocSize,
        offset: (i + 2) * stack.size,
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
    declInstruction,
    retInstruction,
  }: X86FnRetCompilerAttrs): string[] {
    const { allocator } = context;

    const stack = this.getContextStackInfo(allocator);
    const totalArgs = declInstruction.getArgsWithRVO().length;
    const asm: string[] = [];

    if (!declInstruction.isVoid() && retInstruction.value) {
      if (declInstruction.hasRVO()) {
        // copy structure A to B
        asm.push(
          ...compileMemcpy({
            context,
            outputVar: declInstruction.getRVOOutputVar(),
            inputVar: retInstruction.value as IRVariable,
          }),
        );
      } else if (declInstruction.hasReturnValue()) {
        // handle case when we call `return 2`
        const retResolvedArg = allocator.regs.tryResolveIRArgAsReg({
          size: getTypeOffsetByteSize(declInstruction.returnType, 0),
          arg: retInstruction.value,
          allowedRegs: [
            this.getReturnReg({
              context,
              declInstruction,
            }),
          ],
        });

        asm.push(...retResolvedArg.asm);
      }
    }

    asm.push(...allocator.genFnBottomStackFrame());

    if (totalArgs) {
      asm.push(genInstruction('ret', totalArgs * stack.size));
    } else {
      asm.push(genInstruction('ret'));
    }

    return asm;
  }

  private getContextStackInfo(allocator: X86Allocator) {
    const reg = allocator.regs.ownership.getAvailableRegs().stack;
    const size = getX86RegByteSize(reg);

    return {
      reg,
      size,
    };
  }

  private getReturnReg({ context, declInstruction }: X86FnBasicCompilerAttrs) {
    const regs = context.allocator.regs.ownership.getAvailableRegs();
    const { returnType } = declInstruction;

    if (!returnType || returnType.isVoid()) {
      return null;
    }

    return regs.general.list[0];
  }

  private preserveConventionRegsAsm({
    context,
    declInstruction,
  }: X86FnBasicCompilerAttrs) {
    const {
      allocator: { regs },
    } = context;

    const { ownership } = regs;

    const asm: Record<'preserve' | 'restore', string[]> = {
      preserve: [],
      restore: [],
    };

    // preserve already allocated regs on stack
    ownership.releaseNotUsedLaterRegs(true);

    const returnReg = this.getReturnReg({
      context,
      declInstruction,
    });

    if (returnReg) {
      // check if somebody booked `AX` register and swap it if unavailable
      const cachedOwnership = ownership.getOwnershipByReg(returnReg);
      if (cachedOwnership?.length) {
        const newReg = regs.requestReg({
          size: getX86RegByteSize(returnReg),
        });

        asm.preserve.push(
          ...newReg.asm,
          genInstruction('xchg', returnReg, newReg.value),
        );

        cachedOwnership.forEach(varName => {
          ownership.setOwnership(varName, {
            reg: newReg.value,
          });
        });
      }
    }

    Object.entries(ownership.getAllOwnerships()).forEach(
      ([varName, varOwnership]) => {
        if (!isRegOwnership(varOwnership)) {
          return;
        }

        asm.preserve.push(
          withInlineComment(
            genInstruction('push', varOwnership.reg),
            `${chalk.greenBright('preserve:')} ${chalk.blueBright(varName)}`,
          ),
        );

        asm.restore.push(
          withInlineComment(
            genInstruction('pop', varOwnership.reg),
            `${chalk.greenBright('restore:')} ${chalk.blueBright(varName)}`,
          ),
        );
      },
    );

    // push all regs
    return asm;
  }
}

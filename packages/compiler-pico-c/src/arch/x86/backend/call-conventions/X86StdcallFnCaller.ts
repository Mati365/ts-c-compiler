import chalk from 'chalk';

import { CFunctionCallConvention } from '#constants';
import { IRVariable, isIRVariable } from 'frontend/ir/variables';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';
import { isStructLikeType } from 'frontend/analyze';

import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';
import { getTypeOffsetByteSize } from 'frontend/ir/utils';
import { getX86RegByteSize } from '../../constants/regs';
import { genInstruction, withInlineComment } from '../../asm-utils';

import { compileMemcpy, compileStackMemcpy } from '../compilers/shared';
import { isRegOwnership } from '../reg-allocator/utils';
import { IRArgDynamicResolverType } from '../reg-allocator';

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
      const arg = callerInstruction.args[i];
      const baseType = getBaseTypeIfPtr(arg.type);

      if (isStructLikeType(baseType)) {
        if (!isIRVariable(arg)) {
          throw new CBackendError(CBackendErrorCode.NON_CALLABLE_STRUCT_ARG);
        }

        asm.push(...compileStackMemcpy(allocator, baseType, arg));
      } else {
        // perform plain stack push
        const resolvedArg = allocator.regs.tryResolveIrArg({
          arg,
          size: stack.size,
        });

        asm.push(...resolvedArg.asm, genInstruction('push', resolvedArg.value));

        if (resolvedArg.type === IRArgDynamicResolverType.REG) {
          allocator.regs.releaseRegs([resolvedArg.value]);
        }
      }
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
    let stackOffset = stack.size * 2;

    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      const argAllocSize = getBaseTypeIfPtr(arg.type).getByteSize();

      const stackVar = stackFrame.allocRawStackVariable({
        name: arg.name,
        size: argAllocSize,
        offset: stackOffset,
      });

      stackOffset += Math.max(
        stack.size,
        Math.ceil(argAllocSize / stack.size) * stack.size,
      );

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
        const returnReg = this.getReturnReg({
          context,
          declInstruction,
        });

        // handle case when `ax` is already used by `retInstruction.value`
        // but with slightly different size (1 byte but we want to return 2 bytes)
        const usedOwnership =
          isIRVariable(retInstruction.value) &&
          allocator.regs.ownership.getVarOwnership(retInstruction.value.name);

        if (isRegOwnership(usedOwnership) && usedOwnership.reg !== returnReg) {
          asm.push(genInstruction('movzx', returnReg, usedOwnership.reg));
        } else {
          // handle case when we call `return 2`
          const retResolvedArg = allocator.regs.tryResolveIRArgAsReg({
            size: getTypeOffsetByteSize(declInstruction.returnType, 0),
            arg: retInstruction.value,
            allowedRegs: [returnReg],
          });

          asm.push(...retResolvedArg.asm);
        }
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

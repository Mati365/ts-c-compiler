import chalk from 'chalk';

import { CFunctionCallConvention } from '#constants';
import { IRVariable, isIRVariable } from 'frontend/ir/variables';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';
import { isStructLikeType, isUnionLikeType } from 'frontend/analyze';

import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';
import { getTypeOffsetByteSize } from 'frontend/ir/utils';
import { getX86RegByteSize } from '../../constants/regs';
import { genInstruction, withInlineComment } from '../../asm-utils';

import {
  X86CompileInstructionOutput,
  compileMemcpy,
  compileStackMemcpy,
} from '../compilers/shared';

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
  }: X86FnCallerCompilerAttrs) {
    const { allocator } = context;
    const { regs } = allocator;

    const stack = this.getContextStackInfo(allocator);
    const totalNonRVOArgs = callerInstruction.args.length;
    const output = new X86CompileInstructionOutput();

    // preserve already allocated regs on stack
    regs.ownership.releaseNotUsedLaterRegs(
      true,
      callerInstruction.args.flatMap(item =>
        isIRVariable(item) ? [item.name] : [],
      ),
    );

    // do not reorder! it must be called before `getReturnReg` setOwnership!
    const preservedRegs = this.preserveConventionRegsAsm({
      context,
      declInstruction,
    });

    // call function section
    for (let i = totalNonRVOArgs - 1; i >= 0; --i) {
      const arg = callerInstruction.args[i];
      const baseType = getBaseTypeIfPtr(arg.type);

      if (isStructLikeType(baseType) || isUnionLikeType(baseType)) {
        if (!isIRVariable(arg)) {
          throw new CBackendError(CBackendErrorCode.NON_CALLABLE_STRUCT_ARG);
        }

        output.appendGroup(
          compileStackMemcpy({
            allocator,
            arg,
            type: baseType,
          }),
        );
      } else {
        // perform plain stack push
        const resolvedArg = allocator.regs.tryResolveIrArg({
          arg,
          size: stack.size,
        });

        output.appendInstructions(
          ...resolvedArg.asm,
          genInstruction('push', resolvedArg.value),
        );

        if (resolvedArg.type === IRArgDynamicResolverType.REG) {
          allocator.regs.releaseRegs([resolvedArg.value]);
        }
      }
    }

    output.appendInstructions(genInstruction('call', address));

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
      output.appendInstructions(
        genInstruction('add', stack.reg, argsCountDelta * stack.size),
      );
    }

    return new X86CompileInstructionOutput(
      [...preservedRegs.preserve, ...output.asm, ...preservedRegs.restore],
      output.data,
    );
  }

  /**
   * Reads all args in `def` instruction
   */
  allocIRFnDefArgs({ context, declInstruction }: X86FnBasicCompilerAttrs) {
    const { allocator } = context;
    const { stackFrame, memOwnership } = allocator;

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

      memOwnership.setOwnership(arg.name, {
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
  }: X86FnRetCompilerAttrs) {
    const { allocator } = context;

    const stack = this.getContextStackInfo(allocator);
    const totalArgs = declInstruction.getArgsWithRVO().length;
    const output = new X86CompileInstructionOutput();

    if (!declInstruction.isVoid() && retInstruction.value) {
      if (declInstruction.hasRVO()) {
        // copy structure A to B
        output.appendGroup(
          compileMemcpy({
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

        if (
          usedOwnership.reg !== returnReg &&
          getX86RegByteSize(returnReg) -
            getX86RegByteSize(usedOwnership.reg) ===
            1
        ) {
          output.appendInstructions(
            genInstruction('movzx', returnReg, usedOwnership.reg),
          );
        } else {
          // handle case when we call `return 2`
          const retResolvedArg = allocator.regs.tryResolveIRArgAsReg({
            size: getTypeOffsetByteSize(declInstruction.returnType, 0),
            arg: retInstruction.value,
            allowedRegs: [returnReg],
          });

          output.appendInstructions(...retResolvedArg.asm);
          allocator.regs.releaseRegs([retResolvedArg.value]);
        }
      }
    }

    output.appendGroup(allocator.genFnBottomStackFrame());

    if (totalArgs) {
      output.appendInstructions(genInstruction('ret', totalArgs * stack.size));
    } else {
      output.appendInstructions(genInstruction('ret'));
    }

    return output;
  }

  private getContextStackInfo(allocator: X86Allocator) {
    const reg = allocator.regs.ownership.getAvailableRegs().stack;
    const size = getX86RegByteSize(reg);

    return {
      reg,
      size,
    };
  }

  private getReturnReg({ declInstruction }: X86FnBasicCompilerAttrs) {
    const { returnType } = declInstruction;

    if (!returnType || returnType.isVoid()) {
      return null;
    }

    return returnType.getByteSize() === 1 ? 'al' : 'ax';
  }

  private preserveConventionRegsAsm({
    context,
    declInstruction,
  }: X86FnBasicCompilerAttrs) {
    const {
      allocator: { regs, iterator },
    } = context;

    const { ownership } = regs;

    const asm: Record<'preserve' | 'restore', string[]> = {
      preserve: [],
      restore: [],
    };

    const returnReg = this.getReturnReg({
      context,
      declInstruction,
    });

    if (returnReg) {
      // check if somebody booked `AX` register and swap it if unavailable
      const cachedOwnership = ownership
        .getOwnershipByReg(returnReg)
        .filter(varName =>
          ownership.lifetime.isVariableLaterUsed(iterator.offset, varName),
        );

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
      ([varName, regOwnership]) => {
        if (!ownership.lifetime.isVariableLaterUsed(iterator.offset, varName)) {
          return;
        }

        asm.preserve.push(
          withInlineComment(
            genInstruction('push', regOwnership.reg),
            `${chalk.greenBright('preserve:')} ${chalk.blueBright(varName)}`,
          ),
        );

        asm.restore.unshift(
          withInlineComment(
            genInstruction('pop', regOwnership.reg),
            `${chalk.greenBright('restore:')} ${chalk.blueBright(varName)}`,
          ),
        );
      },
    );

    // push all regs
    return asm;
  }
}

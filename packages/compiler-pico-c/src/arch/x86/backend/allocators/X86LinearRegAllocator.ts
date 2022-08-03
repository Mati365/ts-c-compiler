import {X86RegName} from '@x86-toolkit/assembler';

import {hasFlag} from '@compiler/core/utils';
import {isIRConstant, isIRVariable} from '@compiler/pico-c/frontend/ir/variables';

import {CBackendError, CBackendErrorCode} from '@compiler/pico-c/backend/errors/CBackendError';
import {RegsMap, createGeneralPurposeRegsMap} from '../../constants/regs';
import {
  IRArgAllocatorArgs, IRArgAllocatorResult,
  IRArgResolverType, X86AbstractRegAllocator,
} from '../X86AbstractRegAllocator';

import {genInstruction} from '../../asm-utils';
import {getByteSizeArgPrefixName} from '@x86-toolkit/assembler/parser/utils';

type IRRegRequestResult = {
  asm: string[];
  value: X86RegName;
};

export class X86LinearRegAllocator extends X86AbstractRegAllocator {
  private availableRegs: RegsMap;

  analyzeInstructionsBlock(): void {
    this.availableRegs = createGeneralPurposeRegsMap()[this.config.arch];
  }

  resolveIRArg(
    {
      arg,
      allow,
    }: IRArgAllocatorArgs,
  ): IRArgAllocatorResult {
    if (!arg.type.isScalar()) {
      throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
    }

    const {loadsQueue, stackFrame} = this;

    if (isIRConstant(arg)) {
      if (hasFlag(IRArgResolverType.LITERAL, allow)) {
        return {
          type: IRArgResolverType.LITERAL,
          value: arg.constant,
          asm: [],
        };
      }

      if (hasFlag(IRArgResolverType.REG, allow)) {
        const {asm, value} = this.requestReg();
        const prefix = getByteSizeArgPrefixName(arg.type.getByteSize());

        asm.push(
          genInstruction('mov', value, `${prefix} ${arg.constant}`),
        );

        return {
          type: IRArgResolverType.REG,
          value,
          asm,
        };
      }
    }

    if (isIRVariable(arg)) {
      const cachedLoad = loadsQueue[arg.name];
      if (cachedLoad) {
        if (hasFlag(IRArgResolverType.MEM, allow)
            && isIRVariable(cachedLoad.inputVar)
            && stackFrame.isStackVar(cachedLoad.inputVar.name)) {
          const addr = stackFrame.getLocalVarStackRelAddress(cachedLoad.inputVar.name);

          return {
            type: IRArgResolverType.MEM,
            value: addr,
            asm: [],
          };
        }
      }

      return {
        type: IRArgResolverType.REG,
        value: 'ax',
        asm: [],
      };
    }

    throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
  }

  private requestReg(): IRRegRequestResult {
    return {
      value: 'ax',
      asm: [],
    };
  }
}

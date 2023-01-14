import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';
import { hasFlag } from '@compiler/core/utils';

import {
  IRVariable,
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import { X86RegName } from '@x86-toolkit/assembler/index';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { genInstruction } from '../../asm-utils';

import { RegsMap, createGeneralPurposeRegsMap } from '../../constants/regs';
import { RegsMapQuery, queryFromRegsMap } from '../utils/queryFromRegsMap';
import {
  IRArgAllocatorResult,
  IRArgDynamicResolverAttrs,
  IRArgDynamicResolverType,
  IRArgRegResolverAttrs,
  IRRegReqResult,
  X86AbstractRegAllocator,
} from '../X86AbstractRegAllocator';

export class X86BasicRegAllocator extends X86AbstractRegAllocator {
  private availableRegs: RegsMap;

  analyzeInstructionsBlock() {
    this.availableRegs = createGeneralPurposeRegsMap()[this.config.arch];
  }

  tryResolveIRArgAsReg({
    arg,
    specificReg,
  }: IRArgRegResolverAttrs): IRArgAllocatorResult<X86RegName> {
    if (!arg.type.isScalar()) {
      throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
    }

    if (isIRConstant(arg)) {
      const { asm, value } = this.requestReg({ type: arg.type });
      const prefix = getByteSizeArgPrefixName(arg.type.getByteSize());

      asm.push(genInstruction('mov', value, `${prefix} ${arg.constant}`));

      return {
        value,
        asm,
      };
    }

    if (isIRVariable(arg)) {
      const { stackFrame, regOwnership } = this;

      if (regOwnership[arg.name]) {
        return {
          value: regOwnership[arg.name],
          asm: [],
        };
      }

      /**
       * Lookup for tmp variables that contain value from stack frame.
       * Example:
       *  t{1} = load a
       */
      const cachedLoad = this.tryResolveCachedLoadDest(arg.name);
      if (!cachedLoad) {
        return null;
      }

      const stackAddr = stackFrame.getLocalVarStackRelAddress(cachedLoad.name);

      const prefix = getByteSizeArgPrefixName(arg.type.getByteSize());
      const regResult = this.requestReg({
        type: arg.type,
        reg: specificReg,
      });

      const result = {
        value: regResult.value,
        asm: [
          genInstruction('mov', regResult.value, `${prefix} ${stackAddr}`),
          ...regResult.asm,
        ],
      };

      regOwnership[arg.name] = result.value;
      return result;
    }

    return null;
  }

  tryResolveIRArgAsAddr(arg: IRVariable): IRArgAllocatorResult<string> {
    const cachedLoad = this.tryResolveCachedLoadDest(arg.name);
    if (!cachedLoad) {
      return null;
    }

    const stackAddr = this.stackFrame.getLocalVarStackRelAddress(
      cachedLoad.name,
    );

    return {
      asm: [],
      value: stackAddr,
    };
  }

  tryResolveIrArg({
    allow,
    arg,
  }: IRArgDynamicResolverAttrs): IRArgAllocatorResult<string | number> {
    if (hasFlag(IRArgDynamicResolverType.NUMBER, allow) && isIRConstant(arg)) {
      return {
        value: arg.constant,
        asm: [],
      };
    }

    if (hasFlag(IRArgDynamicResolverType.MEM, allow) && isIRVariable(arg)) {
      const result = this.tryResolveIRArgAsAddr(arg);

      if (result) {
        return result;
      }
    }

    if (hasFlag(IRArgDynamicResolverType.REG, allow)) {
      const result = this.tryResolveIRArgAsReg({
        arg,
      });

      if (result) {
        return result;
      }
    }

    throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
  }

  spillReg(reg: X86RegName): void {
    throw new Error(`Todo: Trying to spill... ${reg}!`);
  }

  private tryResolveCachedLoadDest(name: string) {
    const cachedLoad = this.loadInstructions[name];
    if (
      !isIRVariable(cachedLoad?.inputVar) ||
      !this.stackFrame.isStackVar(cachedLoad.inputVar.name)
    ) {
      return null;
    }

    return cachedLoad.inputVar;
  }

  private requestReg(query: RegsMapQuery): IRRegReqResult {
    let result = queryFromRegsMap(query, this.availableRegs);

    if (!result) {
      if (query.reg) {
        this.spillReg(query.reg);
      } else {
        this.spillReg(Object.values(this.regOwnership)[1]);
      }

      result = queryFromRegsMap(query, this.availableRegs);
    }

    this.availableRegs = result.availableRegs;

    return {
      asm: [],
      value: result.reg,
    } as IRRegReqResult;
  }
}

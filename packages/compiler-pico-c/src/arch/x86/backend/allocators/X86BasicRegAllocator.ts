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

import { isX86RegLookup, X86RegLookupQuery } from '../utils';
import { queryFromX86IntRegsMap } from '../utils/queryFromX86IntRegsMap';

import {
  IRArgAllocatorResult,
  IRArgDynamicResolverAttrs,
  IRArgDynamicResolverType,
  IRArgRegResolverAttrs,
  IRDynamicArgAllocatorResult,
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
      const { asm, value } = this.requestReg({
        size: arg.type.getByteSize(),
      });

      const prefix = getByteSizeArgPrefixName(arg.type.getByteSize());
      asm.push(genInstruction('mov', value, `${prefix} ${arg.constant}`));

      return {
        value,
        asm,
      };
    }

    if (isIRVariable(arg)) {
      const { regOwnership, stackFrame } = this;

      if (regOwnership[arg.name]) {
        return {
          value: regOwnership[arg.name].reg,
          asm: [],
        };
      }

      /**
       * Compiler detects temp variable like this:
       *
       * %t{0}: int2B = load a{0}: int*2B
       * %t{1}: int2B = load a{0}: int*2B
       * %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
       *
       * and knows that %t{2} is loading content from a{0}
       */
      const cachedLoad = this.tryResolveCachedLoadDest(arg.name);
      if (!cachedLoad) {
        return null;
      }

      /**
       * Handle reusing of regs:
       *
       * int a = 2;
       * int b = a + a;
       * int c = b * 2;
       *
       * mov ax, [offset var b] ; int b = ...
       * imul ax, 2             ; int c = ...
       */
      if (regOwnership[cachedLoad.name]) {
        return {
          value: regOwnership[cachedLoad.name].reg,
          asm: [],
        };
      }

      const stackAddr = stackFrame.getLocalVarStackRelAddress(cachedLoad.name);
      const prefix = getByteSizeArgPrefixName(arg.type.getByteSize());
      const regResult = this.requestReg({
        size: arg.type.getByteSize(),
        reg: specificReg,
      });

      const result = {
        value: regResult.value,
        asm: [
          genInstruction('mov', regResult.value, `${prefix} ${stackAddr}`),
          ...regResult.asm,
        ],
      };

      regOwnership[arg.name] = { reg: result.value };
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
  }: IRArgDynamicResolverAttrs): IRDynamicArgAllocatorResult {
    if (hasFlag(IRArgDynamicResolverType.NUMBER, allow) && isIRConstant(arg)) {
      return {
        type: IRArgDynamicResolverType.NUMBER,
        value: arg.constant,
        asm: [],
      };
    }

    if (isIRVariable(arg)) {
      if (
        hasFlag(IRArgDynamicResolverType.REG, allow) &&
        this.regOwnership[arg.name]
      ) {
        return {
          type: IRArgDynamicResolverType.REG,
          value: this.regOwnership[arg.name].reg,
          asm: [],
        };
      }

      if (hasFlag(IRArgDynamicResolverType.MEM, allow)) {
        const result = this.tryResolveIRArgAsAddr(arg);

        if (result) {
          return {
            type: IRArgDynamicResolverType.MEM,
            ...result,
          };
        }
      }
    }

    if (hasFlag(IRArgDynamicResolverType.REG, allow)) {
      const result = this.tryResolveIRArgAsReg({
        arg,
      });

      if (result) {
        return {
          type: IRArgDynamicResolverType.REG,
          ...result,
        };
      }
    }

    throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
  }

  releaseReg(reg: X86RegName): void {
    const result = queryFromX86IntRegsMap({ reg }, this.availableRegs);

    // reg is already available to pick, skip
    if (result?.reg) {
      return;
    }

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

  private requestReg(query: X86RegLookupQuery): IRRegReqResult {
    let result = queryFromX86IntRegsMap(query, this.availableRegs);

    if (!result) {
      if (isX86RegLookup(query)) {
        this.releaseReg(query.reg);
      } else {
        this.releaseReg(Object.values(this.regOwnership)[1].reg);
      }

      result = queryFromX86IntRegsMap(query, this.availableRegs);
    }

    this.availableRegs = result.availableRegs;

    return {
      asm: [],
      value: result.reg,
    } as IRRegReqResult;
  }
}

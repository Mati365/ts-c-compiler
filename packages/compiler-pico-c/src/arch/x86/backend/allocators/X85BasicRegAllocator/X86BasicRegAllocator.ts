import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';
import { hasFlag } from '@compiler/core/utils';

import { IRLoadInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import {
  IRVariable,
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import { X86RegName } from '@x86-toolkit/assembler';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { genInstruction } from '../../../asm-utils';

import { isX86RegLookup, X86RegLookupQuery } from '../../utils';
import { queryFromX86IntRegsMap } from '../../utils/queryFromX86IntRegsMap';

import {
  IRArgAllocatorResult,
  IRArgDynamicResolverAttrs,
  IRArgDynamicResolverType,
  IRArgRegResolverAttrs,
  IRDynamicArgAllocatorResult,
  IRRegReqResult,
  X86AbstractRegAllocator,
} from '../../X86AbstractRegAllocator';

import { X86Allocator } from '../../X86Allocator';
import { X86RegOwnershipTracker } from './X86RegOwnershipTracker';

export class X86BasicRegAllocator extends X86AbstractRegAllocator {
  protected readonly ownership: X86RegOwnershipTracker;

  constructor(allocator: X86Allocator) {
    super(allocator);
    this.ownership = new X86RegOwnershipTracker(allocator);
  }

  transferRegOwnership(inputVar: string, reg: X86RegName): void {
    this.ownership.transferRegOwnership(inputVar, reg);
  }

  markRegAsUnused(reg: X86RegName): void {
    this.ownership.dropOwnershipByReg(reg);
  }

  onIRLoad(load: IRLoadInstruction): void {
    this.ownership.setIRLoad(load);
  }

  onAnalyzeInstructionsBlock(): void {
    this.ownership.analyzeInstructionsBlock();
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
      const { ownership, stackFrame } = this;
      const reg = ownership.getVarReg(arg.name);

      if (reg) {
        return {
          value: reg,
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
      const cachedReg = ownership.getVarReg(cachedLoad.name);
      if (cachedReg) {
        return {
          value: cachedReg,
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

      ownership.setRegOwnership(arg.name, { reg: result.value });
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
    arg,
    allow = IRArgDynamicResolverType.REG |
      IRArgDynamicResolverType.MEM |
      IRArgDynamicResolverType.NUMBER,
  }: IRArgDynamicResolverAttrs): IRDynamicArgAllocatorResult {
    if (hasFlag(IRArgDynamicResolverType.NUMBER, allow) && isIRConstant(arg)) {
      return {
        type: IRArgDynamicResolverType.NUMBER,
        value: arg.constant,
        asm: [],
      };
    }

    if (isIRVariable(arg)) {
      const { ownership } = this;

      if (hasFlag(IRArgDynamicResolverType.REG, allow) && ownership[arg.name]) {
        return {
          type: IRArgDynamicResolverType.REG,
          value: ownership[arg.name].reg,
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

  private tryResolveCachedLoadDest(name: string) {
    const cachedLoad = this.ownership.getCachedLoad(name);
    if (
      !isIRVariable(cachedLoad?.inputVar) ||
      !this.stackFrame.isStackVar(cachedLoad.inputVar.name)
    ) {
      return null;
    }

    return cachedLoad.inputVar;
  }

  private requestReg(query: X86RegLookupQuery): IRRegReqResult {
    const { ownership } = this;
    let result = queryFromX86IntRegsMap(query, ownership.getAvailableRegs());

    if (!result) {
      if (isX86RegLookup(query)) {
        ownership.dropOwnershipByReg(query.reg);
      } else {
        ownership.dropOwnershipByReg(
          Object.values(ownership.getAllRegsOwnerships())[0].reg,
        );
      }

      result = queryFromX86IntRegsMap(query, ownership.getAvailableRegs());
    }

    ownership.setAvailableRegs(result.availableRegs);

    return {
      asm: [],
      value: result.reg,
    } as IRRegReqResult;
  }
}

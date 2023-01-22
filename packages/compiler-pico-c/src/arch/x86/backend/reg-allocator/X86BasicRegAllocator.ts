import { hasFlag } from '@compiler/core/utils';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import {
  IRInstructionVarArg,
  IRVariable,
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';
import { genInstruction } from '../../asm-utils';
import { queryFromX86IntRegsMap, X86RegLookupQuery } from '../utils';

import { X86RegName } from '@x86-toolkit/assembler';
import { X86Allocator } from '../X86Allocator';
import { X86RegOwnershipTracker } from './X86RegOwnershipTracker';
import { isRegOwnership, isStackVarOwnership } from './utils';

import { X86_GENERAL_REGS } from '../../constants/regs';

export type IRRegReqResult = {
  asm: string[];
  value: X86RegName;
};

export type IRArgAllocatorResult<V extends string | number = string | number> =
  {
    asm: string[];
    value: V;
  };

type IRArgAllocatorTypedResult<
  T extends IRArgDynamicResolverType,
  V extends string | number,
> = IRArgAllocatorResult<V> & {
  type: T;
};

export enum IRArgDynamicResolverType {
  REG = 1,
  MEM = 2,
  NUMBER = 4,
}

export type IRDynamicArgAllocatorResult =
  | IRArgAllocatorTypedResult<IRArgDynamicResolverType.REG, X86RegName>
  | IRArgAllocatorTypedResult<IRArgDynamicResolverType.MEM, string>
  | IRArgAllocatorTypedResult<IRArgDynamicResolverType.NUMBER, number>;

export type IRArgDynamicResolverAttrs = {
  allow?: IRArgDynamicResolverType;
  arg: IRInstructionVarArg;
};

export type IRArgRegResolverAttrs = {
  allowedRegs?: X86RegName[];
  arg: IRInstructionVarArg;
  allocIfNotFound?: boolean;
};

export class X86BasicRegAllocator {
  readonly ownership: X86RegOwnershipTracker;

  constructor(protected allocator: X86Allocator) {
    this.ownership = new X86RegOwnershipTracker(allocator);
  }

  get config() {
    return this.allocator.config;
  }

  get stackFrame() {
    return this.allocator.stackFrame;
  }

  tryResolveIRArgAsReg({
    arg,
    allowedRegs,
    allocIfNotFound,
  }: IRArgRegResolverAttrs): IRArgAllocatorResult<X86RegName> {
    const { stackFrame, ownership } = this;

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
      const varOwnership = ownership.getVarOwnership(arg.name);

      if (isRegOwnership(varOwnership)) {
        // often called when we request `bx` register for specific variable that we have previously loaded
        // example: int* c = &j; int** ks = &c; **ks = 7;
        // other example: abc[2]++;
        if (allowedRegs && !allowedRegs.includes(varOwnership.reg)) {
          const regResult = this.requestReg({
            size: arg.type.getByteSize(),
            allowedRegs,
          });

          const result = {
            value: regResult.value,
            asm: [
              genInstruction('mov', regResult.value, varOwnership.reg),
              ...regResult.asm,
            ],
          };

          ownership.setOwnership(arg.name, {
            reg: regResult.value,
          });

          return result;
        }

        return {
          value: varOwnership.reg,
          asm: [],
        };
      }

      if (isStackVarOwnership(varOwnership)) {
        const stackAddr = stackFrame.getLocalVarStackRelAddress(
          varOwnership.stackVar.name,
        );

        const regResult = this.requestReg({
          size: arg.type.getByteSize(),
          allowedRegs,
        });

        const result = {
          value: regResult.value,
          asm: [
            genInstruction('mov', regResult.value, stackAddr),
            ...regResult.asm,
          ],
        };

        ownership.setOwnership(arg.name, {
          reg: result.value,
        });

        return result;
      }
    }

    if (allocIfNotFound) {
      const result = this.requestReg({
        allowedRegs,
        size: arg.type.getByteSize(),
      });

      ownership.setOwnership(arg.name, {
        reg: result.value,
      });

      return result;
    }

    return null;
  }

  tryResolveIRArgAsAddr(arg: IRVariable): IRArgAllocatorResult<string> {
    const varOwnership = this.ownership.getVarOwnership(arg.name);
    if (!isStackVarOwnership(varOwnership)) {
      return null;
    }

    const stackAddr = this.stackFrame.getLocalVarStackRelAddress(
      varOwnership.stackVar.name,
    );

    const prefix = getByteSizeArgPrefixName(arg.type.getByteSize());

    return {
      asm: [],
      value: `${prefix} ${stackAddr}`,
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

  requestReg(query: X86RegLookupQuery): IRRegReqResult {
    const { ownership } = this;
    const result = queryFromX86IntRegsMap(
      { allowedRegs: X86_GENERAL_REGS, ...query },
      ownership.getAvailableRegs(),
    );

    if (!result) {
      // todo:
      // - Add spilling register support!
      // - Naive idea: perform fast check all of variables that are currently allocated
      //   and detect which is not needed anymore. Then delete it and release register.
      throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
    }

    ownership.setAvailableRegs(result.availableRegs);

    return {
      asm: [],
      value: result.reg,
    } as IRRegReqResult;
  }
}

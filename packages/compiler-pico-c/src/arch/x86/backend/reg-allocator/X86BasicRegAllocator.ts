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
import {
  queryFromX86IntRegsMap,
  X86IntRegsMapQueryResult,
  X86RegLookupQuery,
} from '../utils';

import { X86RegName } from '@x86-toolkit/assembler';
import { X86Allocator } from '../X86Allocator';
import { X86RegOwnershipTracker } from './X86RegOwnershipTracker';
import { isRegOwnership, isStackVarOwnership } from './utils';

import { getX86RegByteSize } from '../../constants/regs';

export type IRArgAllocatorResult<V extends string | number = string | number> =
  {
    asm: string[];
    size: number;
    value: V;
  };

export type IRRegReqResult = IRArgAllocatorResult<X86RegName>;

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
  arg: IRInstructionVarArg;
  size?: number;
  allow?: IRArgDynamicResolverType;
};

export type IRArgRegResolverAttrs = {
  arg: IRInstructionVarArg;
  size?: number;
  allocIfNotFound?: boolean;
  allowedRegs?: X86RegName[];
};

const ALLOW_ALL_ARG_RESOLVER_METHODS =
  IRArgDynamicResolverType.REG |
  IRArgDynamicResolverType.MEM |
  IRArgDynamicResolverType.NUMBER;

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
    size = arg.type.getByteSize(),
    allowedRegs,
    allocIfNotFound,
  }: IRArgRegResolverAttrs): IRArgAllocatorResult<X86RegName> {
    const { stackFrame, ownership } = this;
    const requestArgSizeDelta = size - arg.type.getByteSize();

    if (size < arg.type.getByteSize()) {
      throw new CBackendError(CBackendErrorCode.VALUE_IS_BIGGER_THAN_REG);
    }

    if (!arg.type.isScalar()) {
      throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
    }

    if (isIRConstant(arg)) {
      const { asm, value } = this.requestReg({
        size,
      });

      const prefix = getByteSizeArgPrefixName(size);
      asm.push(genInstruction('mov', value, `${prefix} ${arg.constant}`));

      return {
        value,
        asm,
        size,
      };
    }

    if (isIRVariable(arg)) {
      const varOwnership = ownership.getVarOwnership(arg.name);

      if (isRegOwnership(varOwnership)) {
        // 1. Case:
        //  handle case: int a = (int) b + 3; where `b: char` is being loaded into bigger reg
        //
        // 2. Case:
        //  often called when we request `bx` register for specific variable that we have previously loaded
        //  example: int* c = &j; int** ks = &c; **ks = 7;
        //  other example: abc[2]++;

        if (
          (allowedRegs && !allowedRegs.includes(varOwnership.reg)) ||
          requestArgSizeDelta
        ) {
          const regResult = this.requestReg({
            size,
            allowedRegs,
          });

          ownership.setOwnership(arg.name, {
            reg: regResult.value,
          });

          const movOpcode = requestArgSizeDelta >= 1 ? 'movzx' : 'mov';
          const result = {
            size,
            value: regResult.value,
            asm: [
              ...regResult.asm,
              genInstruction(movOpcode, regResult.value, varOwnership.reg),
            ],
          };

          return result;
        }

        // handle case when we already loaded variable into reg previously
        // and we require the same value in smaller reg
        // example:
        //  char[] letters = "Hello world";
        //  char b = letters[0];

        const regSize = getX86RegByteSize(varOwnership.reg);
        if (regSize !== size) {
          const regPart =
            ownership.getAvailableRegs().general.parts[varOwnership.reg];

          if (regPart && regPart.size === size) {
            return {
              value: regPart.low,
              asm: [],
              size,
            };
          }

          throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
        }

        return {
          value: varOwnership.reg,
          size,
          asm: [],
        };
      }

      if (isStackVarOwnership(varOwnership)) {
        const stackAddr = stackFrame.getLocalVarStackRelAddress(
          varOwnership.stackVar.name,
        );

        const regResult = this.requestReg({
          size,
          allowedRegs,
        });

        // handle case: int a = (int) b + 3; where `b: char` is being loaded into bigger reg
        const movOpcode = requestArgSizeDelta >= 1 ? 'movzx' : 'mov';
        const result = {
          size,
          value: regResult.value,
          asm: [
            ...regResult.asm,
            genInstruction(movOpcode, regResult.value, stackAddr),
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
        size,
      });

      ownership.setOwnership(arg.name, {
        reg: result.value,
      });

      return result;
    }

    return null;
  }

  tryResolveIRArgAsAddr(
    arg: IRVariable,
    prefixSize: number = arg.type.getByteSize(),
  ): IRArgAllocatorResult<string> {
    const varOwnership = this.ownership.getVarOwnership(arg.name);
    if (!isStackVarOwnership(varOwnership)) {
      return null;
    }

    const stackAddr = this.stackFrame.getLocalVarStackRelAddress(
      varOwnership.stackVar.name,
    );

    const prefix = getByteSizeArgPrefixName(prefixSize);

    return {
      asm: [],
      size: prefixSize,
      value: `${prefix} ${stackAddr}`,
    };
  }

  tryResolveIrArg({
    arg,
    size = arg.type.getByteSize(),
    allow = ALLOW_ALL_ARG_RESOLVER_METHODS,
  }: IRArgDynamicResolverAttrs): IRDynamicArgAllocatorResult {
    const argSize = arg.type.getByteSize();

    if (hasFlag(IRArgDynamicResolverType.NUMBER, allow) && isIRConstant(arg)) {
      return {
        type: IRArgDynamicResolverType.NUMBER,
        value: arg.constant,
        asm: [],
        size,
      };
    }

    if (isIRVariable(arg)) {
      const { ownership } = this;

      if (hasFlag(IRArgDynamicResolverType.REG, allow) && ownership[arg.name]) {
        return {
          type: IRArgDynamicResolverType.REG,
          ...this.tryResolveIRArgAsReg({
            arg,
            size,
          }),
        };
      }

      if (hasFlag(IRArgDynamicResolverType.MEM, allow)) {
        const result = this.tryResolveIRArgAsAddr(arg);

        // handle case when we want to resolve address but receive it as word
        // example: %t{3}: char1B = %t{1}: int2B plus %t{2}: char1B
        // %t{2} should return word
        if (
          result &&
          hasFlag(IRArgDynamicResolverType.REG, allow) &&
          size > argSize
        ) {
          const extendedResult = this.tryResolveIRArgAsAddr(arg, size);
          const outputReg = this.requestReg({
            size,
          });

          return {
            type: IRArgDynamicResolverType.REG,
            value: outputReg.value,
            asm: [
              ...extendedResult.asm,
              genInstruction('movzx', outputReg.value, extendedResult.value),
            ],
            size,
          };
        }

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
        size,
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

  requestReg({
    prefer,
    ...query
  }: X86RegLookupQuery & { prefer?: X86RegName[] }): IRRegReqResult {
    const { ownership } = this;
    const { general: generalRegs } = ownership.getAvailableRegs();
    const defaultAllowedRegs =
      generalRegs.size === query.size ? generalRegs.list : null;

    let result: X86IntRegsMapQueryResult = null;

    if (prefer) {
      result ||= queryFromX86IntRegsMap(
        { allowedRegs: prefer, ...query },
        ownership.getAvailableRegs(),
      );
    }

    // if there is no preferred regs just pick any free
    result ||= queryFromX86IntRegsMap(
      { allowedRegs: defaultAllowedRegs, ...query },
      ownership.getAvailableRegs(),
    );

    if (!result) {
      ownership.releaseNotUsedLaterRegs();
      result = queryFromX86IntRegsMap(
        { allowedRegs: defaultAllowedRegs, ...query },
        ownership.getAvailableRegs(),
      );
    }

    if (!result) {
      // todo:
      // - Add spilling register support!
      throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
    }

    ownership.setAvailableRegs(result.availableRegs);

    return {
      asm: [],
      size: getX86RegByteSize(result.reg as X86RegName),
      value: result.reg as X86RegName,
    };
  }
}

import { BINARY_MASKS } from '@ts-cc/core';

import { hasFlag } from '@ts-cc/core';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { IRInstructionTypedArg, isIRConstant, isIRVariable } from 'frontend/ir/variables';

import { isStructLikeType, isUnionLikeType } from 'frontend/analyze';

import { getByteSizeArgPrefixName } from '@ts-cc/x86-assembler';
import { genInstruction, withInlineComment } from '../../../asm-utils';
import {
  queryAndMarkX86RegsMap,
  queryX86RegsMap,
  X86RegsMapQueryAndSetResult,
  X86RegLookupQuery,
} from '../../utils';

import { X86RegName } from '@ts-cc/x86-assembler';
import { X86Allocator } from '../../X86Allocator';
import { X86RegOwnershipTracker } from './X86RegOwnershipTracker';

import { getX86RegByteSize } from '../../../constants/regs';
import { castToPointerIfArray } from 'frontend/analyze/casts';
import { X86MemOwnershipTracker } from '../mem';
import { isLabelOwnership, isStackVarOwnership } from '../mem/ownership';

export type IRArgAllocatorResult<V extends string | number = string | number> = {
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

export type IRArgRegResolverAttrs = {
  arg: IRInstructionTypedArg;
  size?: number;
  allocIfNotFound?: boolean;
  preferRegs?: X86RegName[];
  allowedRegs?: X86RegName[];
  noOwnership?: boolean;
  forceLabelMemPtr?: boolean;
};

export type IRArgDynamicResolverAttrs = Pick<
  IRArgRegResolverAttrs,
  'arg' | 'size' | 'allowedRegs' | 'noOwnership' | 'forceLabelMemPtr'
> & {
  allow?: IRArgDynamicResolverType;
  withoutMemPtrSize?: boolean;
};

const ALLOW_ALL_ARG_RESOLVER_METHODS =
  IRArgDynamicResolverType.REG |
  IRArgDynamicResolverType.MEM |
  IRArgDynamicResolverType.NUMBER;

export class X86BasicRegAllocator {
  readonly ownership: X86RegOwnershipTracker;

  constructor(private allocator: X86Allocator) {
    this.ownership = new X86RegOwnershipTracker(allocator);
  }

  get memOwnership() {
    return this.allocator.memOwnership;
  }

  get config() {
    return this.allocator.config;
  }

  get stackFrame() {
    return this.allocator.stackFrame;
  }

  tryResolveIRArgAsReg(attrs: IRArgRegResolverAttrs): IRArgAllocatorResult<X86RegName> {
    const { stackFrame, ownership, memOwnership } = this;
    const {
      arg,
      size = castToPointerIfArray(arg.type).getByteSize(),
      forceLabelMemPtr,
      preferRegs,
      allowedRegs,
      noOwnership,
      allocIfNotFound = !noOwnership,
    } = attrs;

    const regsParts = ownership.getAvailableRegs().general.parts;
    const requestArgSizeDelta = size - castToPointerIfArray(arg.type).getByteSize();

    if (
      !castToPointerIfArray(arg.type).isScalar() &&
      !isUnionLikeType(arg.type) &&
      !isStructLikeType(arg.type) &&
      !arg.type.canBeStoredInReg()
    ) {
      throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
    }

    if (isIRConstant(arg)) {
      const { asm, value } = this.requestReg({
        prefer: preferRegs,
        allowedRegs,
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

    // 1. handles case when we perform resolve arg on plain `a` variable
    // it is forbidden because stack var ownership for this kind of variables
    // should not be ever overridden! Use additional IRLoadInstruction on this variable
    // if you want to resolve it otherwise you will receive only stack address.
    // see: REMEMBER TO CLEANUP REG!
    if (!arg.isTemporary()) {
      if (!noOwnership && !allocIfNotFound) {
        throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
      }

      const { asm, value } = this.requestReg({
        allowedRegs: attrs.allowedRegs,
        prefer: preferRegs,
        size,
      });

      const stackAddr = stackFrame.getLocalVarStackRelAddress(arg.name);

      if (!stackAddr) {
        throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
      }

      return {
        asm: [...asm, genInstruction(allocIfNotFound ? 'mov' : 'lea', value, stackAddr)],
        value,
        size,
      };
    }

    if (isIRVariable(arg)) {
      const memAddr = memOwnership.getVarOwnership(arg.name);
      const regOwnership = ownership.getVarOwnership(arg.name);

      if (regOwnership) {
        const varOwnershipRegSize = getX86RegByteSize(regOwnership.reg);

        // 1. Case:
        //  handle case: int a = (int) b + 3; where `b: char` is being loaded into bigger reg
        //
        // 2. Case:
        //  often called when we request `bx` register for specific variable that we have previously loaded
        //  example: int* c = &j; int** ks = &c; **ks = 7;
        //  other example: abc[2]++;

        if (
          (allowedRegs && !allowedRegs.includes(regOwnership.reg)) ||
          requestArgSizeDelta
        ) {
          const regResult = this.requestReg({
            prefer: preferRegs,
            size,
            allowedRegs,
          });

          if (!noOwnership) {
            ownership.setOwnership(arg.name, {
              reg: regResult.value,
            });
          }

          const movOpcode = regResult.size - varOwnershipRegSize === 1 ? 'movzx' : 'mov';

          return {
            size,
            value: regResult.value,
            asm: [
              ...regResult.asm,
              genInstruction(movOpcode, regResult.value, regOwnership.reg),
            ],
          };
        }

        // handle case when we already loaded variable into reg previously
        // and we require the same value in smaller reg
        // example:
        //  char[] letters = "Hello world";
        //  char b = letters[0];

        if (varOwnershipRegSize - size === 1) {
          const regPart = regsParts[regOwnership.reg];

          // variable is placed in AX / BX / etc. type registers that
          // have smaller parts like AL / AH / etc.
          if (regPart && regPart.size === size) {
            return {
              value: regPart.low,
              asm: [],
              size,
            };
          }

          // but in some cases ownership of reg is already using bigger reg than requested
          // in that cases just alloc next one
          const regResult = this.requestReg({
            prefer: preferRegs,
            size: varOwnershipRegSize,
            allowedRegs,
          });

          return {
            size,
            value: regsParts[regResult.value].low,
            asm: [
              ...regResult.asm,
              genInstruction('mov', regResult.value, regOwnership.reg),
            ],
          };
        } else if (varOwnershipRegSize - size > 1) {
          throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
        }

        return {
          value: regOwnership.reg,
          size,
          asm: [],
        };
      }

      if (isLabelOwnership(memAddr)) {
        const regResult = this.requestReg({
          prefer: preferRegs,
          size,
          allowedRegs,
        });

        if (!noOwnership) {
          ownership.setOwnership(arg.name, {
            reg: regResult.value,
          });
        }

        const address = X86MemOwnershipTracker.tryResolveLabelOwnershipAddr(memAddr, {
          forceMemPtr: forceLabelMemPtr,
        });

        return {
          size,
          value: regResult.value,
          asm: [genInstruction('mov', regResult.value, address)],
        };
      }

      if (isStackVarOwnership(memAddr)) {
        const stackAddr = stackFrame.getLocalVarStackRelAddress(memAddr.stackVar.name);

        const regResult = this.requestReg({
          prefer: preferRegs,
          size,
          allowedRegs,
        });

        // handle case: int a = (int) b + 3; where `b: char` is being loaded into bigger reg
        const movOpcode = requestArgSizeDelta >= 1 ? 'movzx' : 'mov';
        const result = {
          size,
          value: regResult.value,
          asm: [...regResult.asm, genInstruction(movOpcode, regResult.value, stackAddr)],
        };

        // it will not cause an issue due to IR specification
        // we do not ever resolve directly stack args!
        if (!noOwnership) {
          ownership.setOwnership(arg.name, {
            reg: result.value,
          });
        }

        return result;
      }
    }

    if (allocIfNotFound) {
      const result = this.requestReg({
        prefer: preferRegs,
        allowedRegs,
        size,
      });

      if (!noOwnership) {
        ownership.setOwnership(arg.name, {
          reg: result.value,
        });
      }

      return result;
    }

    return null;
  }

  tryResolveIrArg(attrs: IRArgDynamicResolverAttrs): IRDynamicArgAllocatorResult {
    const {
      arg,
      allowedRegs,
      noOwnership,
      forceLabelMemPtr,
      withoutMemPtrSize,
      size = arg.type.getByteSize(),
      allow = ALLOW_ALL_ARG_RESOLVER_METHODS,
    } = attrs;

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
      if (
        hasFlag(IRArgDynamicResolverType.REG, allow) &&
        this.ownership.getVarOwnership(arg.name)
      ) {
        return {
          type: IRArgDynamicResolverType.REG,
          ...this.tryResolveIRArgAsReg({
            arg,
            size,
            allowedRegs,
            noOwnership,
            forceLabelMemPtr,
          }),
        };
      }

      if (hasFlag(IRArgDynamicResolverType.MEM, allow)) {
        const result = this.memOwnership.tryResolveIRArgAsAddr(arg, {
          forceLabelMemPtr,
          withoutMemPtrSize,
          prefixSize: size,
        });

        // handle case when we want to load word but type at the address is byte
        // example:
        //  char a = 'a';
        //  int b = 4;
        //  if (a > b && a + 4 > b) {
        //    int k = 0;
        //  }

        if (result && hasFlag(IRArgDynamicResolverType.REG, allow) && size > argSize) {
          const extendedResult = this.memOwnership.tryResolveIRArgAsAddr(arg, {
            prefixSize: size,
            forceLabelMemPtr,
            withoutMemPtrSize,
          });

          const outputReg = this.requestReg({
            size,
            allowedRegs,
          });

          return {
            type: IRArgDynamicResolverType.REG,
            value: outputReg.value,
            asm: [
              ...extendedResult.asm,
              ...outputReg.asm,
              genInstruction('mov', outputReg.value, extendedResult.value),
              genInstruction(
                'and',
                outputReg.value,
                `0x${BINARY_MASKS[argSize].toString(16)}`,
              ),
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
        allowedRegs,
        noOwnership,
        forceLabelMemPtr,
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

  releaseRegs(regs: X86RegName[]) {
    return this.ownership.releaseRegs(regs);
  }

  checkIfRegIsAvailable(query: X86RegLookupQuery) {
    return queryX86RegsMap(query, this.ownership.getAvailableRegs());
  }

  requestReg({
    prefer,
    recursiveCall,
    ...query
  }: X86RegLookupQuery & {
    prefer?: X86RegName[];
    recursiveCall?: boolean;
  }): IRRegReqResult {
    const { ownership, memOwnership, stackFrame } = this;
    const { general: generalRegs } = ownership.getAvailableRegs();
    const defaultAllowedRegs = generalRegs.size === query.size ? generalRegs.list : null;

    let result: X86RegsMapQueryAndSetResult = null;

    if (prefer) {
      result ||= queryAndMarkX86RegsMap(
        { ...query, allowedRegs: prefer },
        ownership.getAvailableRegs(),
      );
    }

    // if there is no preferred regs just pick any free
    result ||= queryAndMarkX86RegsMap(
      {
        allowedRegs: defaultAllowedRegs,
        ...query,
      },
      ownership.getAvailableRegs(),
    );

    if (!result) {
      ownership.releaseNotUsedLaterRegs();
      result = queryAndMarkX86RegsMap(
        {
          allowedRegs: defaultAllowedRegs,
          ...query,
        },
        ownership.getAvailableRegs(),
      );
    }

    if (!result && recursiveCall) {
      throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
    }

    if (!result) {
      if (query.size) {
        const [reg] = query.allowedRegs?.filter(
          allowedReg => getX86RegByteSize(allowedReg) === query.size,
        ) ?? ['ax'];

        const spillVar = stackFrame.allocSpillVariable(query.size);
        const ownerships = ownership.getOwnershipByReg(reg);

        ownerships.forEach(ownershipName => {
          ownership.dropOwnership(ownershipName);
          memOwnership.setOwnership(ownershipName, {
            stackVar: spillVar,
          });
        });

        const spillResult = this.requestReg({
          recursiveCall: true,
          prefer,
          ...query,
        });

        return {
          ...spillResult,
          asm: [
            withInlineComment(
              genInstruction(
                'mov',
                stackFrame.getLocalVarStackRelAddress(spillVar.name),
                reg,
              ),
              'spill!',
            ),
            ...spillResult.asm,
          ],
        };
      }

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

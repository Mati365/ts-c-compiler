import { BINARY_MASKS } from '@compiler/core/constants';

import { hasFlag } from '@compiler/core/utils';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import {
  IRInstructionTypedArg,
  IRVariable,
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import { isStructLikeType } from '@compiler/pico-c/frontend/analyze';

import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';
import {
  genInstruction,
  genMemAddress,
  GenMemAddressConfig,
} from '../../asm-utils';
import {
  queryAndMarkX86RegsMap,
  queryX86RegsMap,
  X86RegsMapQueryAndSetResult,
  X86RegLookupQuery,
} from '../utils';

import { X86RegName } from '@x86-toolkit/assembler';
import { X86Allocator } from '../X86Allocator';
import { X86RegOwnershipTracker } from './X86RegOwnershipTracker';
import {
  IRLabelVarOwnership,
  isLabelOwnership,
  isRegOwnership,
  isStackVarOwnership,
} from './utils';
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

  tryResolveIRArgAsReg(
    attrs: IRArgRegResolverAttrs,
  ): IRArgAllocatorResult<X86RegName> {
    const { stackFrame, ownership } = this;
    const {
      arg,
      size = arg.type.getByteSize(),
      forceLabelMemPtr,
      preferRegs,
      allowedRegs,
      allocIfNotFound,
      noOwnership,
    } = attrs;

    const regsParts = ownership.getAvailableRegs().general.parts;
    const requestArgSizeDelta = size - arg.type.getByteSize();

    if (
      !arg.type.isScalar() &&
      (!isStructLikeType(arg.type) || !arg.type.canBeStoredInReg())
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
        prefer: preferRegs,
        size,
      });

      const stackAddr = stackFrame.getLocalVarStackRelAddress(arg.name);

      if (!stackAddr) {
        throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
      }

      return {
        asm: [
          ...asm,
          genInstruction(allocIfNotFound ? 'mov' : 'lea', value, stackAddr),
        ],
        value,
        size,
      };
    }

    if (isIRVariable(arg)) {
      const varOwnership = ownership.getVarOwnership(arg.name);

      if (isLabelOwnership(varOwnership)) {
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

        const address = this.tryResolveLabelOwnershipAddr(varOwnership, {
          forceMemPtr: forceLabelMemPtr,
        });

        return {
          size,
          value: regResult.value,
          asm: [genInstruction('mov', regResult.value, address)],
        };
      }

      if (isRegOwnership(varOwnership)) {
        const varOwnershipRegSize = getX86RegByteSize(varOwnership.reg);

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
            prefer: preferRegs,
            size,
            allowedRegs,
          });

          if (!noOwnership) {
            ownership.setOwnership(arg.name, {
              reg: regResult.value,
            });
          }

          const movOpcode = requestArgSizeDelta ? 'movzx' : 'mov';

          return {
            size,
            value: regResult.value,
            asm: [
              ...regResult.asm,
              genInstruction(movOpcode, regResult.value, varOwnership.reg),
            ],
          };
        }

        // handle case when we already loaded variable into reg previously
        // and we require the same value in smaller reg
        // example:
        //  char[] letters = "Hello world";
        //  char b = letters[0];

        if (varOwnershipRegSize - size === 1) {
          const regPart = regsParts[varOwnership.reg];

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
              genInstruction('mov', regResult.value, varOwnership.reg),
            ],
          };
        } else if (varOwnershipRegSize - size > 1) {
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
          prefer: preferRegs,
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

  tryResolveLabelOwnershipAddr(
    ownership: IRLabelVarOwnership,
    addrConfig?: Omit<GenMemAddressConfig, 'expression'> & {
      forceMemPtr?: boolean;
    },
  ) {
    const { asmLabel, arrayPtr } = ownership;

    return arrayPtr && !addrConfig?.forceMemPtr
      ? asmLabel
      : genMemAddress({ expression: asmLabel, ...addrConfig });
  }

  tryResolveIRArgAsAddr(
    arg: IRVariable,
    {
      prefixSize = arg.type.getByteSize(),
      forceLabelMemPtr,
    }: {
      prefixSize?: number;
      forceLabelMemPtr?: boolean;
    } = {},
  ): IRArgAllocatorResult<string> {
    const varOwnership = this.ownership.getVarOwnership(arg.name);
    const prefixSizeName = getByteSizeArgPrefixName(prefixSize);

    if (isStackVarOwnership(varOwnership)) {
      const stackAddr = this.stackFrame.getLocalVarStackRelAddress(
        varOwnership.stackVar.name,
      );

      return {
        asm: [],
        size: prefixSize,
        value: `${prefixSizeName} ${stackAddr}`,
      };
    }

    if (isLabelOwnership(varOwnership)) {
      return {
        asm: [],
        size: prefixSize,
        value: this.tryResolveLabelOwnershipAddr(varOwnership, {
          size: prefixSizeName,
          forceMemPtr: forceLabelMemPtr,
        }),
      };
    }

    return null;
  }

  tryResolveIrArg(
    attrs: IRArgDynamicResolverAttrs,
  ): IRDynamicArgAllocatorResult {
    const {
      arg,
      allowedRegs,
      noOwnership,
      forceLabelMemPtr,
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
      const { ownership } = this;

      if (hasFlag(IRArgDynamicResolverType.REG, allow) && ownership[arg.name]) {
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
        const result = this.tryResolveIRArgAsAddr(arg, {
          forceLabelMemPtr,
        });

        // handle case when we want to load word but type at the address is byte
        // example:
        //  char a = 'a';
        //  int b = 4;
        //  if (a > b && a + 4 > b) {
        //    int k = 0;
        //  }

        if (
          result &&
          hasFlag(IRArgDynamicResolverType.REG, allow) &&
          size > argSize
        ) {
          const extendedResult = this.tryResolveIRArgAsAddr(arg, {
            prefixSize: size,
            forceLabelMemPtr,
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
    ...query
  }: X86RegLookupQuery & { prefer?: X86RegName[] }): IRRegReqResult {
    const { ownership } = this;
    const { general: generalRegs } = ownership.getAvailableRegs();
    const defaultAllowedRegs =
      generalRegs.size === query.size ? generalRegs.list : null;

    let result: X86RegsMapQueryAndSetResult = null;

    if (prefer) {
      result ||= queryAndMarkX86RegsMap(
        { ...query, allowedRegs: prefer },
        ownership.getAvailableRegs(),
      );
    }

    // if there is no preferred regs just pick any free
    result ||= queryAndMarkX86RegsMap(
      { allowedRegs: defaultAllowedRegs, ...query },
      ownership.getAvailableRegs(),
    );

    if (!result) {
      ownership.releaseNotUsedLaterRegs();
      result = queryAndMarkX86RegsMap(
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

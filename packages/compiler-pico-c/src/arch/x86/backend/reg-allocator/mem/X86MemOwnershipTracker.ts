import { getByteSizeArgPrefixName } from '@ts-c-compiler/x86-assembler';

import { GenMemAddressConfig, genMemAddress } from 'arch/x86/asm-utils';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import {
  isStackVarOwnership,
  isLabelOwnership,
  type IRLabelVarOwnership,
  type IRMemOwnershipMap,
  type IRMemOwnershipValue,
} from './ownership';

import type { IRVariable } from 'frontend/ir/variables';
import type { X86Allocator } from '../../X86Allocator';

export type IRArgMemResult = {
  asm: string[];
  size: number;
  value: string;
};

export class X86MemOwnershipTracker {
  private readonly map: IRMemOwnershipMap = {};

  constructor(private readonly allocator: X86Allocator) {}

  aliasOwnership(inputVar: string, outputVar: string) {
    if (!this.map[inputVar]) {
      throw new CBackendError(CBackendErrorCode.UNKNOWN_BACKEND_ERROR);
    }

    this.map[outputVar] = { ...this.map[inputVar] };
  }

  setOwnership(varName: string, ownership: IRMemOwnershipValue) {
    this.map[varName] = ownership;
  }

  tryResolveIRArgAsAddr(
    arg: IRVariable,
    {
      prefixSize = arg.type.getByteSize(),
      forceLabelMemPtr,
      withoutMemPtrSize,
    }: {
      prefixSize?: number;
      forceLabelMemPtr?: boolean;
      withoutMemPtrSize?: boolean;
    } = {},
  ): IRArgMemResult {
    const memAddr = this.getVarOwnership(arg.name);
    const prefixSizeName = getByteSizeArgPrefixName(prefixSize);

    if (isStackVarOwnership(memAddr)) {
      const stackAddr = this.allocator.stackFrame.getLocalVarStackRelAddress(
        memAddr.stackVar.name,
      );

      return {
        asm: [],
        size: prefixSize,
        value: withoutMemPtrSize ? stackAddr : `${prefixSizeName} ${stackAddr}`,
      };
    }

    if (isLabelOwnership(memAddr)) {
      return {
        asm: [],
        size: prefixSize,
        value: X86MemOwnershipTracker.tryResolveLabelOwnershipAddr(memAddr, {
          forceMemPtr: forceLabelMemPtr,
          ...(!withoutMemPtrSize && {
            size: prefixSizeName,
          }),
        }),
      };
    }

    return null;
  }

  static tryResolveLabelOwnershipAddr(
    ownership: IRLabelVarOwnership,
    addrConfig?: Omit<GenMemAddressConfig, 'expression'> & {
      forceMemPtr?: boolean;
    },
  ) {
    const { asmLabel } = ownership;

    return !addrConfig?.forceMemPtr
      ? asmLabel
      : genMemAddress({ expression: asmLabel, ...addrConfig });
  }

  dropOwnership(varName: string) {
    delete this.map[varName];
  }

  getVarOwnership(inputVar: string) {
    return this.map[inputVar];
  }
}

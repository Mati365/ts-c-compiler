import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { isPointerLikeType } from '@compiler/pico-c/frontend/analyze';
import { IRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';

import { genComment, genInstruction, genMemAddress } from '../../../asm-utils';
import { X86CompilerFnAttrs } from '../../../constants/types';

type MemcpyConfig = X86CompilerFnAttrs & {
  inputVar: IRVariable;
  outputVar: IRVariable;
};

export function compileMemcpy({ context, inputVar, outputVar }: MemcpyConfig) {
  if (!isPointerLikeType(inputVar.type) || !isPointerLikeType(outputVar.type)) {
    throw new CBackendError(CBackendErrorCode.INCORRECT_MEMCPY_ARGS);
  }

  const {
    allocator: { regs },
  } = context;

  const availableRegs = regs.ownership.getAvailableRegs();
  const inputByteSize = inputVar.type.baseType.getByteSize();

  const asm = [
    genComment(
      `memcpy ${inputVar.getDisplayName()} -> ${outputVar.getDisplayName()}`,
    ),
  ];

  // alloc regs
  const dataReg = regs.requestReg({
    size: availableRegs.general.size,
  });

  const srcAddrReg = regs.tryResolveIRArgAsReg({
    arg: inputVar,
    preferRegs: availableRegs.addressing,
    noOwnership: true,
  });

  const destAddrReg = regs.tryResolveIRArgAsReg({
    arg: outputVar,
    preferRegs: availableRegs.addressing,
    noOwnership: true,
  });

  asm.push(...srcAddrReg.asm, ...destAddrReg.asm, ...dataReg.asm);

  // copy data
  let offset = 0;

  for (; offset < inputByteSize; offset += dataReg.size) {
    const srcAddr = genMemAddress({
      size: getByteSizeArgPrefixName(dataReg.size),
      expression: srcAddrReg.value,
      offset,
    });

    const destAddr = genMemAddress({
      size: getByteSizeArgPrefixName(dataReg.size),
      expression: destAddrReg.value,
      offset,
    });

    asm.push(
      genComment(`offset = ${offset}B`),
      genInstruction('mov', dataReg.value, srcAddr),
      genInstruction('mov', destAddr, dataReg.value),
    );
  }

  // handle case when we have 5B struct but reg can copy 2B at time
  // 1B is extra, that byte is not packed so good
  if (inputByteSize % dataReg.size !== 0) {
    const deltaSize = inputByteSize % dataReg.size;

    const srcAddr = genMemAddress({
      size: getByteSizeArgPrefixName(dataReg.size),
      expression: srcAddrReg.value,
      offset,
    });

    const destAddr = genMemAddress({
      size: getByteSizeArgPrefixName(deltaSize),
      expression: destAddrReg.value,
      offset,
    });

    asm.push(
      genComment(`offset [unpacked] = ${offset}B`),
      genInstruction('mov', dataReg.value, srcAddr),
      genInstruction(
        'mov',
        destAddr,
        availableRegs.general.parts[dataReg.value].low,
      ),
    );
  }

  regs.releaseRegs([dataReg.value, destAddrReg.value, srcAddrReg.value]);
  return asm;
}

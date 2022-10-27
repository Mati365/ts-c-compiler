import {CBackendError, CBackendErrorCode} from '@compiler/pico-c/backend/errors/CBackendError';
import {RegsMap, createGeneralPurposeRegsMap} from '../../constants/regs';
import {RegsMapQuery, queryFromRegsMap} from '../utils/queryFromRegsMap';
import {
  IRArgAllocatorArgs, IRArgAllocatorResult,
  IRRegReqResult, X86AbstractRegAllocator,
} from '../X86AbstractRegAllocator';

export class X86BasicRegAllocator extends X86AbstractRegAllocator {
  private availableRegs: RegsMap;

  analyzeInstructionsBlock() {
    this.availableRegs = createGeneralPurposeRegsMap()[this.config.arch];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolveIRArg(attrs: IRArgAllocatorArgs): IRArgAllocatorResult {
    throw new CBackendError(CBackendErrorCode.REG_ALLOCATOR_ERROR);
  }

  requestReg(query: RegsMapQuery): IRRegReqResult {
    return queryFromRegsMap(query, this.availableRegs).match<IRRegReqResult>(
      {
        some: ({availableRegs, reg}) => {
          this.availableRegs = availableRegs;
          return {
            value: <any> reg,
            asm: [],
          };
        },
        none: () => {
          return {
            value: 'ax',
            asm: [],
          };
        },
      },
    );
  }
}

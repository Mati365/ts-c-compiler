import * as R from 'ramda';

import { X86RegName } from '@ts-cc/x86-assembler';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { createX86RegsMap, RegsMap } from '../../../constants/regs';
import { restoreInX86IntRegsMap, setAvailabilityInRegsMap } from '../../utils';

import { X86Allocator } from '../../X86Allocator';

import type { IRRegOwnership, IRRegOwnershipMap } from './ownership';

export class X86RegOwnershipTracker {
  protected availableRegs: RegsMap;
  protected ownership: IRRegOwnershipMap = {};

  constructor(private allocator: X86Allocator) {
    this.availableRegs = createX86RegsMap()[this.config.arch];
  }

  get lifetime() {
    return this.allocator.lifetime;
  }

  get config() {
    return this.allocator.config;
  }

  get stackFrame() {
    return this.allocator.stackFrame;
  }

  setAvailableRegs(regs: RegsMap) {
    this.availableRegs = regs;
  }

  getAvailableRegs() {
    return this.availableRegs;
  }

  getVarOwnership(inputVar: string) {
    return this.ownership[inputVar];
  }

  getAllOwnerships() {
    return this.ownership;
  }

  dropOwnership(varName: string) {
    const item = this.ownership[varName];
    if (!item) {
      return;
    }

    const ownerships = this.getOwnershipByReg(item.reg);

    if (item.noPrune) {
      return;
    }

    if (ownerships.length === 1) {
      this.releaseRegs([item.reg]);
    }

    delete this.ownership[varName];
  }

  swapRegOwnership(srcReg: X86RegName, destReg: X86RegName) {
    const srcVars = this.getOwnershipByReg(srcReg);
    const destVars = this.getOwnershipByReg(destReg);

    destVars.forEach(varName => {
      this.ownership[varName] = { reg: srcReg };
    });

    srcVars.forEach(varName => {
      this.ownership[varName] = { reg: destReg };
    });
  }

  aliasOwnership(inputVar: string, outputVar: string) {
    if (!this.ownership[inputVar]) {
      throw new CBackendError(CBackendErrorCode.UNKNOWN_BACKEND_ERROR);
    }

    this.ownership[outputVar] = {
      ...this.ownership[inputVar],
    };
  }

  setOwnership(
    inputVar: string,
    {
      releasePrevAllocatedReg = true,
      ...value
    }: IRRegOwnership & {
      releasePrevAllocatedReg?: boolean;
    },
  ) {
    // edge case in phi functions:
    // if both: value and varName is phi function
    // do not drop ownership!
    // example:
    //    jmp L2
    //    L1:
    //    %t{0}: int2B = assign:φ %1: int2B
    //    jmp L3
    //    L2:
    //    %t{1}: char1B = assign:φ %0: int2B
    //
    // %t{0} and t{1} can use the same register (ax for example)!
    this.getOwnershipByReg(value.reg).forEach(varName => {
      const varOwnership = this.ownership[varName];

      // skip if both variables are phi - reused register
      if (value.noPrune && varOwnership.noPrune) {
        return;
      }

      delete this.ownership[varName];
    });

    if (releasePrevAllocatedReg) {
      this.availableRegs = setAvailabilityInRegsMap(
        { allowedRegs: [value.reg] },
        true,
        this.availableRegs,
      );
    }

    this.dropOwnership(inputVar);
    this.ownership[inputVar] = value;
  }

  releaseNotUsedLaterRegs(exclusive: boolean = false, excludeVars?: string[]) {
    const { lifetime, ownership, allocator } = this;
    const { offset } = allocator.iterator;

    R.forEachObjIndexed((_, varName) => {
      if (
        !lifetime.isVariableLaterUsed(offset, varName, exclusive) &&
        (!excludeVars || !excludeVars.includes(varName))
      ) {
        this.dropOwnership(varName);
      }
    }, ownership);
  }

  releaseAllRegs({ exceptVars }: { exceptVars?: string[] } = {}) {
    const { ownership } = this;

    R.forEachObjIndexed((_, varName) => {
      if (!exceptVars || !exceptVars.includes(varName)) {
        this.dropOwnership(varName);
      }
    }, ownership);
  }

  releaseRegs(regs: X86RegName[]) {
    this.availableRegs = regs.reduce(
      (acc, reg) => restoreInX86IntRegsMap({ allowedRegs: [reg] }, acc),
      this.availableRegs,
    );
  }

  getOwnershipByReg(reg: X86RegName, lookupInPartials?: boolean) {
    const varNames: string[] = [];
    const regsParts = this.getAvailableRegs().general.parts;

    R.forEachObjIndexed((item, varName) => {
      if (
        item.reg === reg ||
        (lookupInPartials &&
          (regsParts[item.reg]?.low === reg || regsParts[item.reg]?.high === reg))
      ) {
        varNames.push(varName);
      }
    }, this.ownership);

    return varNames;
  }
}

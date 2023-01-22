import * as R from 'ramda';

import { X86RegName } from '@x86-toolkit/assembler';

import { X86Allocator } from '../X86Allocator';
import { IROwnershipMap, IROwnershipValue, isRegOwnership } from './utils';

import { createX86RegsMap, RegsMap } from '../../constants/regs';
import { restoreRegInX86IntRegsMap } from '../utils';

export class X86RegOwnershipTracker {
  protected ownership: IROwnershipMap = {};
  protected availableRegs: RegsMap;

  constructor(protected allocator: X86Allocator) {
    this.availableRegs = createX86RegsMap()[this.config.arch];
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

  setOwnership(varName: string, value: IROwnershipValue) {
    this.ownership[varName] = value;
  }

  getOwnershipByReg(reg: X86RegName) {
    const varNames: string[] = [];

    R.forEachObjIndexed((item, varName) => {
      if (isRegOwnership(item) && item.reg === reg) {
        varNames.push(varName);
      }
    }, this.ownership);

    return varNames;
  }

  swapRegOwnership(srcReg: X86RegName, destReg: X86RegName) {
    this.getOwnershipByReg(srcReg).forEach(varName => {
      this.ownership[varName] = { reg: destReg };
    });
  }

  dropOwnershipByReg(reg: X86RegName, updateAvailableRegs: boolean = true) {
    this.getOwnershipByReg(reg).forEach(varName => {
      delete this.ownership[varName];
    });

    if (updateAvailableRegs) {
      const { availableRegs } = restoreRegInX86IntRegsMap(
        { reg },
        this.availableRegs,
      );

      this.availableRegs = availableRegs;
    }
  }

  /**
   * Transfers register ownership between temp variables
   */
  transferRegOwnership(inputVar: string, reg: X86RegName) {
    this.dropOwnershipByReg(reg, false);
    this.ownership[inputVar] = {
      reg,
    };
  }

  releaseAllRegs() {
    R.forEachObjIndexed((item, key) => {
      if (isRegOwnership(item) && !item.noPrune) {
        this.dropOwnershipByReg(item.reg);
        delete this.ownership[key];
      }
    }, this.ownership);
  }
}

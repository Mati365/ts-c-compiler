import * as R from 'ramda';

import { X86RegName } from '@x86-toolkit/assembler';

import { createX86RegsMap, RegsMap } from '../../constants/regs';
import { restoreInX86IntRegsMap, setAvailabilityInRegsMap } from '../utils';

import { X86Allocator } from '../X86Allocator';
import { IROwnershipMap, IROwnershipValue, isRegOwnership } from './utils';
import { X86VarLifetimeGraph } from './X86VarLifetimeGraph';

export class X86RegOwnershipTracker {
  protected ownership: IROwnershipMap = {};
  protected availableRegs: RegsMap;
  readonly lifetime: X86VarLifetimeGraph;

  constructor(private allocator: X86Allocator) {
    this.availableRegs = createX86RegsMap()[this.config.arch];
    this.lifetime = new X86VarLifetimeGraph(allocator.instructions);
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

    if (isRegOwnership(item)) {
      const ownerships = this.getOwnershipByReg(item.reg);
      if (ownerships.length === 1) {
        this.releaseRegs([item.reg]);
      }
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

  setOwnership(
    inputVar: string,
    {
      releasePrevAllocatedReg = true,
      ...value
    }: IROwnershipValue & { releasePrevAllocatedReg?: boolean },
  ) {
    if (isRegOwnership(value)) {
      this.getOwnershipByReg(value.reg).forEach(varName => {
        delete this.ownership[varName];
      });

      if (releasePrevAllocatedReg) {
        this.availableRegs = setAvailabilityInRegsMap(
          { allowedRegs: [value.reg] },
          true,
          this.availableRegs,
        );
      }
    }

    this.dropOwnership(inputVar);
    this.ownership[inputVar] = value;
  }

  releaseAllRegs() {
    const { ownership } = this;
    const unusedRegs: X86RegName[] = [];

    R.forEachObjIndexed((item, key) => {
      if (isRegOwnership(item) && !item.noPrune) {
        unusedRegs.push(item.reg);
        delete ownership[key];
      }
    }, ownership);

    this.releaseRegs(unusedRegs);
  }

  releaseNotUsedLaterRegs() {
    const { lifetime, ownership, allocator } = this;
    const { offset } = allocator.iterator;

    R.forEachObjIndexed((_, varName) => {
      if (
        isRegOwnership(ownership[varName]) &&
        !lifetime.isVariableLaterUsed(offset, varName)
      ) {
        this.dropOwnership(varName);
      }
    }, ownership);
  }

  private getOwnershipByReg(reg: X86RegName) {
    const varNames: string[] = [];

    R.forEachObjIndexed((item, varName) => {
      if (isRegOwnership(item) && item.reg === reg) {
        varNames.push(varName);
      }
    }, this.ownership);

    return varNames;
  }

  private releaseRegs(regs: X86RegName[]) {
    this.availableRegs = regs.reduce(
      (acc, reg) => restoreInX86IntRegsMap({ allowedRegs: [reg] }, acc),
      this.availableRegs,
    );
  }
}

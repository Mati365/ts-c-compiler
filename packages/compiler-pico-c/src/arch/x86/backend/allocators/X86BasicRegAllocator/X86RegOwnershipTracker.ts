import * as R from 'ramda';

import { IRLoadInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import { X86RegName } from '@x86-toolkit/assembler';
import { X86Allocator } from '../../X86Allocator';

import { createGeneralPurposeRegsMap, RegsMap } from '../../../constants/regs';
import { restoreRegInX86IntRegsMap } from '../../utils';

type IRRegOwnershipValue = {
  reg: X86RegName;
};

export class X86RegOwnershipTracker {
  protected loadInstructions: Record<string, IRLoadInstruction> = {};
  protected regOwnership: Partial<Record<string, IRRegOwnershipValue>> = {};
  protected availableRegs: RegsMap;

  constructor(protected allocator: X86Allocator) {}

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

  getVarReg(inputVar: string) {
    return this.regOwnership[inputVar]?.reg;
  }

  getAllRegsOwnerships() {
    return this.regOwnership;
  }

  getCachedLoad(name: string): IRLoadInstruction {
    return this.loadInstructions[name];
  }

  /**
   * Some instructions such like add / sub allows to skip enter
   * and load arg directly from memory.
   */
  setIRLoad(load: IRLoadInstruction): this {
    this.loadInstructions[load.outputVar.name] = load;
    return this;
  }

  setRegOwnership(varName: string, value: IRRegOwnershipValue) {
    this.regOwnership[varName] = value;
  }

  getOwnershipByReg(reg: X86RegName) {
    const { regOwnership } = this;
    const varNames: string[] = [];

    for (const varName in regOwnership) {
      if (regOwnership[varName].reg === reg) {
        varNames.push(varName);
      }
    }

    return varNames;
  }

  dropOwnershipByReg(reg: X86RegName, updateAvailableRegs: boolean = true) {
    this.getOwnershipByReg(reg).forEach(varName => {
      delete this.regOwnership[varName];
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
    this.regOwnership[inputVar] = {
      reg,
    };
  }

  releaseAllRegs() {
    R.forEachObjIndexed(({ reg }) => {
      this.dropOwnershipByReg(reg);
    }, this.regOwnership);

    this.regOwnership = {};
  }

  analyzeInstructionsBlock() {
    this.availableRegs = createGeneralPurposeRegsMap()[this.config.arch];
  }
}

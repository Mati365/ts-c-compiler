import {IRInstruction, IRLoadInstruction} from '@compiler/pico-c/frontend/ir/instructions';
import {IRInstructionVarArg} from '@compiler/pico-c/frontend/ir/variables';
import {IRBlockIterator} from './iterators/IRBlockIterator';
import {X86Allocator} from './X86Allocator';

export enum IRArgResolverType {
  REG = 1,
  MEM = 2,
  LITERAL = 3,
}

export type IRArgAllocatorResult = {
  asm: string[];
  value: number | string;
  type: IRArgResolverType;
};

export type IRArgAllocatorArgs = {
  iterator: IRBlockIterator;
  allow: IRArgResolverType;
  arg: IRInstructionVarArg;
};

export abstract class X86AbstractRegAllocator {
  protected loadsQueue: Record<string, IRLoadInstruction> = {};

  constructor(
    protected allocator: X86Allocator,
  ) {}

  get config() { return this.allocator.config; }
  get stackFrame() { return this.allocator.stackFrame; }

  /**
   * Some instructions such like add / sub allows to skip enter
   * and load arg directly from memory.
   *
   * @param {IRLoadInstruction} load
   * @return {this}
   * @memberof X86AbstractRegAllocator
   */
  queueIRLoad(load: IRLoadInstruction): this {
    this.loadsQueue[load.outputVar.name] = load;
    return this;
  }

  /**
   * Function executed before attending to compile instructions block
   *
   * @abstract
   * @param {IRInstruction[]} instructions
   * @memberof X86AbstractRegAllocator
   */
  abstract analyzeInstructionsBlock(instructions: IRInstruction[]): void;

  /**
   *
   *
   * @abstract
   * @param {IRArgAllocatorArgs} arg
   * @return {IRArgAllocatorResult}
   * @memberof X86AbstractRegAllocator
   */
  abstract resolveIRArg(arg: IRArgAllocatorArgs): IRArgAllocatorResult;
}

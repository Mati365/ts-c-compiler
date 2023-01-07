import { IRError, IRErrorCode } from '../../errors/IRError';
import { IRInstruction, isIRFnDeclInstruction } from '../../instructions';

import { IRInstructionsBlock } from '../../instructions/IRInstructionsBlock';
import { IRSegmentBuilder } from './IRSegmentBuilder';

export type IRBlockLabelsMap = Record<string, IRInstructionsBlock>;
export type IRCodeSegmentBuilderResult = {
  blocks: IRBlockLabelsMap;
};

/**
 * Constructs graph of connected by jumps code blocks
 */
export class IRCodeSegmentBuilder extends IRSegmentBuilder<IRCodeSegmentBuilderResult> {
  private blocks: IRBlockLabelsMap = {};
  private tmpBlock = IRInstructionsBlock.ofInstructions([]);

  get instructions() {
    return this.tmpBlock.instructions;
  }

  get lastInstruction() {
    return this.tmpBlock.lastInstruction;
  }

  /**
   * Removes last instruction from stack
   */
  pop(): IRInstruction {
    return this.tmpBlock.instructions.pop();
  }

  /**
   * If instruction is branch - flush instruction stack and add new block
   */
  emit(instruction: IRInstruction): this {
    if (isIRFnDeclInstruction(instruction)) {
      this.flush();
      this.tmpBlock = this.tmpBlock.ofName(instruction.name);
    }

    this.instructions.push(instruction);
    return this;
  }

  /**
   * Cleanups temp instructions stack and returns graph
   */
  flush(): IRCodeSegmentBuilderResult {
    this.setBlock(this.tmpBlock);
    this.tmpBlock = IRInstructionsBlock.ofInstructions([]);

    return {
      blocks: this.blocks,
    };
  }

  /**
   * Appends new block to blocks map, raises errors if fails
   */
  private setBlock(block: IRInstructionsBlock): this {
    if (block.isEmpty()) {
      return this;
    }

    if (!block.name) {
      throw new IRError(IRErrorCode.MISSING_BLOCK_NAME);
    }

    this.blocks[block.name] = block;
    return this;
  }
}

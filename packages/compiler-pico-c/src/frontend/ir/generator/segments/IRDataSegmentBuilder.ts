import { IRInstruction } from '../../instructions';
import { IRSegmentBuilder } from './IRSegmentBuilder';

export type IRDataSegmentBuilderResult = {
  instructions: IRInstruction[];
};

/**
 * Initialized data block builder
 */
export class IRDataSegmentBuilder extends IRSegmentBuilder<IRDataSegmentBuilderResult> {
  private instructions: IRInstruction[] = [];

  /**
   * Emit instruction and return this
   */
  emit(instruction: IRInstruction): this {
    this.instructions.push(instruction);
    return this;
  }

  /**
   * Returns all instructions
   */
  flush(): IRDataSegmentBuilderResult {
    return {
      instructions: this.instructions,
    };
  }
}

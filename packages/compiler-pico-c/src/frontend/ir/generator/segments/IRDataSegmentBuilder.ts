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

  emit(instruction: IRInstruction): this {
    this.instructions.push(instruction);
    return this;
  }

  flush(): IRDataSegmentBuilderResult {
    return {
      instructions: this.instructions,
    };
  }
}

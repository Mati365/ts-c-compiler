import { IRInstructionsBlock } from '@compiler/pico-c/frontend/ir/instructions';
import { optimizeInstructionsList } from './optimizeInstructionsList';

export function optimizeInstructionsBlock(
  block: IRInstructionsBlock,
): IRInstructionsBlock {
  return block.mapInstructions(optimizeInstructionsList);
}

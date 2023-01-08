import { IRInstructionsBlock } from '../../instructions';
import { optimizeInstructionsList } from './optimizeInstructionsList';

export function optimizeInstructionsBlock(
  block: IRInstructionsBlock,
): IRInstructionsBlock {
  return block.mapInstructions(optimizeInstructionsList);
}

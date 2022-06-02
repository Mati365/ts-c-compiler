import {CIRError, CIRErrorCode} from '../errors/CIRError';
import {
  CIRIfInstruction, CIRInstruction,
  isIRIfInstruction, isIRRetInstruction,
} from '../instructions';

import {CIRInstructionsBlock} from '../instructions/CIRInstructionsBlock';
import {isIRLabeledInstruction} from '../guards';

export type CIRBlockLabelsMap = Record<string, CIRInstructionsBlock>;
export type CIRBranchesBuilderResult = {
  blocks: CIRBlockLabelsMap,
};

/**
 * Constructs graph of connected by jumps code blocks
 *
 * @export
 * @class CIRBranchesBuilder
 */
export class CIRBranchesBuilder {
  private blocks: CIRBlockLabelsMap = {};
  private unresolvedBlockBranches: VoidFunction[] = [];
  private tmpBlock = CIRInstructionsBlock.ofInstructions([]);

  get lastInstruction() {
    return this.tmpBlock.lastInstruction;
  }

  /**
   * Removes last instruction from stack
   *
   * @return {CIRInstruction}
   * @memberof CIRBranchesBuilder
   */
  pop(): CIRInstruction {
    return this.tmpBlock.instructions.pop();
  }

  /**
   * If instruction is branch - flush instruction stack and add new block
   *
   * @param {CIRInstruction} instruction
   * @memberof CIRBranchesBuilder
   */
  emit(instruction: CIRInstruction): this {
    const {tmpBlock} = this;
    const {instructions} = tmpBlock;

    instructions.push(instruction);

    if (isIRLabeledInstruction(instruction))
      this.tmpBlock = tmpBlock.ofName(instruction.name);
    else if (isIRIfInstruction(instruction))
      this.appendIfBranch(instruction);
    else if (isIRRetInstruction(instruction))
      this.flush();

    return this;
  }

  /**
   * Emits multiple instructions at once
   *
   * @param {CIRInstruction[]} instructions
   * @memberof CIRBranchesBuilder
   */
  emitBulk(instructions: CIRInstruction[]): this {
    instructions.forEach(this.emit.bind(this));
    return this;
  }

  /**
   * Cleanups temp instructions stack and returns graph
   *
   * @return {CIRBranchesBuilderResult}
   * @memberof CIRBranchesBuilder
   */
  flush(): CIRBranchesBuilderResult {
    this.setBlock(this.tmpBlock);
    this.tmpBlock = CIRInstructionsBlock.ofInstructions([]);

    return {
      blocks: this.blocks,
    };
  }

  /**
   * Creates new code block of tmp and resets actual tmpBlock
   *
   * @private
   * @param {CIRIfInstruction} instruction
   * @memberof CIRBranchesBuilder
   */
  private appendIfBranch(instruction: CIRIfInstruction) {
    const {tmpBlock, unresolvedBlockBranches} = this;
    const {ifTrue, ifFalse} = instruction;

    if (!tmpBlock.name)
      throw new CIRError(CIRErrorCode.MISSING_BLOCK_NAME);

    const tryResolveJmps = () => ({
      ifTrue: this.blocks[ifTrue.name],
      ifFalse: this.blocks[ifFalse?.name],
    });

    const newBlock = tmpBlock.ofJmps(tryResolveJmps());
    if (newBlock.hasSatisfiedRelations(instruction)) {
      unresolvedBlockBranches.push(() => {
        this.setBlock(newBlock.ofJmps(tryResolveJmps()));
      });
    }

    this.setBlock(newBlock);
    this.tmpBlock = CIRInstructionsBlock.ofInstructions([]);
  }

  /**
   * Appends new block to blocks map, raises errors if fails
   *
   * @private
   * @param {CIRInstructionsBlock} block
   * @return  {this}
   * @memberof CIRBranchesBuilder
   */
  private setBlock(block: CIRInstructionsBlock): this {
    if (block.isEmpty())
      return this;

    if (!block.name)
      throw new CIRError(CIRErrorCode.MISSING_BLOCK_NAME);

    this.blocks[block.name] = block;
    return this;
  }
}

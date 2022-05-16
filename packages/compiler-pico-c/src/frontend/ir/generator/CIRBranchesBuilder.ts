import {CIRError, CIRErrorCode} from '../errors/CIRError';
import {CIRIfInstruction, CIRInstruction, isIRIfInstruction, isIRLabelInstruction} from '../instructions';
import {CIRInstructionsBlock} from '../instructions/CIRInstructionsBlock';

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

  /**
   * If instruction is branch - flush instruction stack and add new block
   *
   * @param {CIRInstruction} instruction
   * @memberof CIRBranchesBuilder
   */
  emit(instruction: CIRInstruction): this {
    const {tmpBlock} = this;

    tmpBlock.instructions.push(instruction);
    if (isIRLabelInstruction(instruction))
      this.tmpBlock = tmpBlock.ofName(instruction.name);
    else if (isIRIfInstruction(instruction))
      this.appendBranch(instruction);

    return this;
  }

  /**
   * Cleanups temp instructions stack and returns graph
   *
   * @return {CIRBranchesBuilderResult}
   * @memberof CIRBranchesBuilder
   */
  flush(): CIRBranchesBuilderResult {
    return {
      blocks: this.setBlock(this.tmpBlock).blocks,
    };
  }

  /**
   * Creates new code block of tmp and resets actual tmpBlock
   *
   * @private
   * @param {CIRIfInstruction} instruction
   * @memberof CIRBranchesBuilder
   */
  private appendBranch(instruction: CIRIfInstruction) {
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

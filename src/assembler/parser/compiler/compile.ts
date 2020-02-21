import * as R from 'ramda';

import {ASTNode} from '../ast/ASTNode';
import {ASTNodeKind} from '../ast/types';
import {ASTInstruction} from '../ast/Instruction/ASTInstruction';
import {BinaryInstruction} from './BinaryInstruction/BinaryInstruction';
import {InstructionArgSize} from '../../types';

export class X86Compiler {
  constructor(
    public readonly instructions: ASTNode[],
    public readonly mode: InstructionArgSize = InstructionArgSize.WORD,
  ) {}

  compile() {
    const {instructions} = this;

    R.forEach(
      (node) => {
        if (node.kind === ASTNodeKind.INSTRUCTION) {
          const binaryInstruction = new BinaryInstruction(<ASTInstruction> node);

          // eslint-disable-next-line
          console.log(binaryInstruction.ast.toString(), binaryInstruction.compile(this));
        }
      },
      instructions,
    );
  }
}

/**
 * Transform array of nodes into binary
 *
 * @export
 * @param {ASTNode[]} nodes
 */
export function compile(nodes: ASTNode[]): void {
  new X86Compiler(nodes).compile();
}

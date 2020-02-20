import * as R from 'ramda';

import {ASTNode} from '../ast/ASTNode';
import {ASTNodeKind} from '../ast/types';
import {ASTInstruction} from '../ast/Instruction/ASTInstruction';
import {BinaryInstruction} from './BinaryInstruction/BinaryInstruction';

/**
 * Transform array of nodes into binary
 *
 * @export
 * @param {ASTNode[]} nodes
 */
export function compile(nodes: ASTNode[]): void {
  R.forEach(
    (node) => {
      if (node.kind === ASTNodeKind.INSTRUCTION)
        BinaryInstruction.compile(<ASTInstruction> node);
    },
    nodes,
  );
}

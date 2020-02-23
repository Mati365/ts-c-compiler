import * as R from 'ramda';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {InstructionArgSize} from '../../types';

import {ASTNode} from '../ast/ASTNode';
import {ASTNodeKind, BinaryLabelsOffsets} from '../ast/types';
import {ASTInstruction} from '../ast/Instruction/ASTInstruction';
import {ASTLabel} from '../ast/Label/ASTLabel';

import {BinaryInstruction} from './BinaryInstruction';
import {BinaryBlob} from './BinaryBlob';

/**
 * Flips value with key in Map
 *
 * @template Key
 * @template Value
 * @param {Map<Key, Value>} map
 * @returns {Map<Value, Key>}
 */
function flipMap<Key, Value>(map: Map<Key, Value>): Map<Value, Key> {
  const flipped = new Map<Value, Key>();
  for (const [key, val] of map)
    flipped.set(val, key);

  return flipped;
}

/**
 * Contains meta information about compiled data
 *
 * @export
 * @class BinaryBlobSet
 */
export class SecondPassResult {
  constructor(
    public readonly offset: number = 0,
    public labelsOffsets: BinaryLabelsOffsets = new Map,
    public blobs: Map<number, BinaryBlob> = new Map,
  ) {}

  /**
   * Resets whole blob
   *
   * @memberof BinaryBlobSet
   */
  clear() {
    const {labelsOffsets, blobs} = this;

    labelsOffsets.clear();
    blobs.clear();
  }

  /**
   * Prints in human way, like objdump blob
   *
   * @returns
   * @memberof BinaryBlobSet
   */
  toString() {
    const {labelsOffsets, blobs} = this;
    const lines = [];

    const labelsByOffsets = flipMap(labelsOffsets);
    const maxLabelLength = R.reduce(
      (acc, label) => Math.max(acc, label.length),
      0,
      Array.from(labelsOffsets.keys()),
    );

    for (const [offset, blob] of blobs) {
      const offsetStr = `0x${offset.toString(16).padStart(4, '0')}`;
      let labelStr = (labelsByOffsets.get(offset) || '');
      if (labelStr)
        labelStr = `${labelStr}:`;

      lines.push(`${labelStr.padEnd(maxLabelLength + 4)}${offsetStr}: ${blob.toString(true)}`);
    }

    return R.join('\n', lines);
  }
}

export class FirstPassResult {
  constructor(
    public readonly labels: BinaryLabelsOffsets = new Map<string, number>(),
    public readonly nodesOffsets = new Map<number, ASTNode>(),
  ) {}
}

/**
 * Transforms AST tree into binary set of data
 *
 * @see
 *  Output may contain unresolved ASTInstruction (like jmps) for second pass!
 *  They should be erased after second pass
 *
 * @export
 * @class X86Compiler
 */
export class X86Compiler {
  constructor(
    public readonly nodes: ASTNode[],
    public readonly mode: InstructionArgSize = InstructionArgSize.WORD,
  ) {}

  /**
   * First pass compiler, omit labels and split into multiple chunks
   *
   * @private
   * @returns {FirstPassResult}
   * @memberof X86Compiler
   */
  private firstPass(): FirstPassResult {
    const {nodes} = this;
    const result = new FirstPassResult;
    let offset = 0;

    R.forEach(
      (node) => {
        switch (node.kind) {
          case ASTNodeKind.INSTRUCTION: {
            const instruction = <ASTInstruction> node;
            const size = instruction.getPessimisticByteSize();

            result.nodesOffsets.set(offset, instruction);
            offset += size;
          } break;

          case ASTNodeKind.LABEL:
            result.labels.set((<ASTLabel> node).name, offset);
            break;

          case ASTNodeKind.DEFINE: break;

          default:
            throw new ParserError(ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION, null, {instruction: node.toString()});
        }
      },
      nodes,
    );

    return result;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Find unresolved instructions, try resolve them and emit binaries
   *
   * @private
   * @param {FirstPassResult} firstPassResult
   * @returns {SecondPassResult}
   * @memberof X86Compiler
   */
  private secondPass(firstPassResult: FirstPassResult): SecondPassResult {
    const {labels, nodesOffsets} = firstPassResult;
    const result = new SecondPassResult(0x0, labels);

    // eslint-disable-next-line prefer-const
    for (let [offset, node] of nodesOffsets) {
      if (node instanceof ASTInstruction) {
        const pessimisticSize = node.getPessimisticByteSize();

        if (node.hasUnresolvedLabels()) {
          const resolved = (
            node
              .replaceLabelsArgsWithAddresses(labels)
              .tryResolveSchema()
          );

          // todo: fixme, it should be loop until satisfy
          if (!resolved)
            throw new ParserError(ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION, null, {instruction: node.toString()});
        }

        // check if size shrinked
        const shrinkBytes = pessimisticSize - node.schemas[0].byteSize;
        if (shrinkBytes) {
          // if so decrement precceding instruction offsets and label offsets
          for (const [label, labelOffset] of labels) {
            if (labelOffset > offset)
              labels.set(label, labelOffset - shrinkBytes);
          }

          // if so decrement precceding instruction offsets and label offsets
          const newOffsets = new Map<number, ASTNode>();
          for (const [instructionOffset, instruction] of nodesOffsets) {
            if (instructionOffset > offset)
              newOffsets.set(instructionOffset - shrinkBytes, instruction);
          }

          // no need for old already parsed nodes, just clear
          nodesOffsets.clear();
          Array.from(newOffsets).forEach(
            ([instructionOffset, instruction]) => {
              nodesOffsets.set(instructionOffset, instruction);
            },
          );
        }

        // todo: handle still unresolved labels
        result.blobs.set(
          offset,
          new BinaryInstruction(node).compile(this, offset),
        );
      }
    }

    return result;
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Transform provided AST nodes array into binary blobs
   *
   * @returns {X86Compiler}
   * @memberof X86Compiler
   */
  compile(): SecondPassResult {
    if (!this.nodes)
      return null;

    return this.secondPass(
      this.firstPass(),
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
  const output = new X86Compiler(nodes).compile();

  /* eslint-disable no-console */
  const str = output?.toString();
  if (str)
    console.log(str);
  /* eslint-enable no-console */
}

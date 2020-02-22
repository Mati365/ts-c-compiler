import * as R from 'ramda';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {
  InstructionArgSize,
  BinaryLabelsOffsets,
} from '../../types';

import {ASTNode} from '../ast/ASTNode';
import {ASTNodeKind} from '../ast/types';
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
export class BinaryBlobSet {
  constructor(
    public readonly offset: number = 0,
    public labelsOffsets: BinaryLabelsOffsets = new Map,
    public blobs: Map<number, BinaryBlob> = new Map,
  ) {}

  clear() {
    const {labelsOffsets, blobs} = this;

    labelsOffsets.clear();
    blobs.clear();
  }

  toString() {
    const {labelsOffsets, blobs} = this;
    const labelsByOffsets = flipMap(labelsOffsets);

    const lines = [];

    for (const [offset, blob] of blobs) {
      const offsetStr = `0x${offset.toString(16).padStart(4, '0')}`;
      let labelStr = (labelsByOffsets.get(offset) || '');
      if (labelStr)
        labelStr = `${labelStr}:`;

      lines.push(`${labelStr.padEnd(10)}${offsetStr}: ${blob.toString(true)}`);
    }

    return R.join('\n', lines);
  }
}

/**
 * Transforms AST tree into binary set of data
 *
 * @export
 * @class X86Compiler
 */
export class X86Compiler {
  constructor(
    public readonly nodes: ASTNode[],
    public readonly mode: InstructionArgSize = InstructionArgSize.WORD,

    private _blobSets: BinaryBlobSet[] = [],
    private _offset: number = 0,
  ) {}

  get lastBlob() { return R.last(this._blobSets); }
  get blobSets() { return this._blobSets; }
  get currentLength() { return this._offset; }

  /**
   * Appends new block into last blob
   *
   * @private
   * @param {BinaryBlob} blob
   * @memberof X86Compiler
   */
  private emitBlob(blob: BinaryBlob): void {
    this.lastBlob.blobs.set(this._offset, blob);
    this._offset += blob.binary.length;
  }

  /**
   * Emits label into last blob
   *
   * @private
   * @param {string} name
   * @memberof X86Compiler
   */
  private emitLabel(name: string): void {
    this.lastBlob.labelsOffsets.set(name, this._offset);
  }

  /**
   * First pass compiler, omit labels and split into multiple chunks
   *
   * @private
   * @memberof X86Compiler
   */
  private firstPass(): void {
    const {nodes} = this;

    this._offset = 0;
    this._blobSets = [
      new BinaryBlobSet,
    ];

    R.forEach(
      (node) => {
        switch (node.kind) {
          case ASTNodeKind.INSTRUCTION: {
            const instruction = <ASTInstruction> node;

            if (instruction.isResolvedSchema()) {
              this.emitBlob(
                new BinaryInstruction(instruction).compile(this),
              );
            } else {
              console.warn(instruction.toString());
            }
          } break;

          case ASTNodeKind.LABEL:
            this.emitLabel((<ASTLabel> node).name);
            break;

          case ASTNodeKind.DEFINE: break;

          default:
            throw new ParserError(ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION, null, {instruction: node.toString()});
        }
      },
      nodes,
    );
  }

  /**
   * Transform provided AST nodes array into binary blobs
   *
   * @returns {X86Compiler}
   * @memberof X86Compiler
   */
  compile(): X86Compiler {
    if (this.nodes)
      this.firstPass();

    return this;
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
  const str = output.blobSets.map(String).join('\n');
  if (str)
    console.log(str);
  /* eslint-enable no-console */
}

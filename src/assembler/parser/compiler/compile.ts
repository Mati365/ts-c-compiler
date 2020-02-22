import * as R from 'ramda';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {ASTNode} from '../ast/ASTNode';
import {ASTNodeKind} from '../ast/types';
import {ASTInstruction} from '../ast/Instruction/ASTInstruction';
import {InstructionArgSize} from '../../types';

import {BinaryInstruction} from './BinaryInstruction';
import {BinaryBlob} from './BinaryBlob';

/**
 * Contains meta information about compiled data
 *
 * @export
 * @class BinaryBlobSet
 */
export class BinaryBlobSet {
  public labelsOffsets: Map<string, number> = new Map;
  public blobs: Map<number, BinaryBlob> = new Map;

  clear() {
    const {labelsOffsets, blobs} = this;

    labelsOffsets.clear();
    blobs.clear();
  }

  toString() {
    const lines = [];

    for (const [offset, blob] of this.blobs) {
      const offsetStr = `0x${offset.toString(16).padStart(4, '0')}`;
      const astStr = blob.ast?.toString().padEnd(20);
      const binStr = blob.binary
        .map(
          (num) => `0x${num.toString(16).padStart(2, '0')}`,
        )
        .join(', ');

      lines.push(`${offsetStr}: ${astStr} ${binStr}`);
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

    public _blobSet: BinaryBlobSet = new BinaryBlobSet,
    private _offset: number = 0,
  ) {}

  get blobSet() { return this._blobSet; }
  get currentLength() { return this._offset; }

  /**
   * Appends new block into blob set
   *
   * @private
   * @param {BinaryBlob} blob
   * @memberof X86Compiler
   */
  private emitBlob(blob: BinaryBlob): void {
    this._blobSet.blobs.set(this._offset, blob);
    this._offset += blob.binary.length;
  }

  /**
   * Transform provided AST nodes array into binary blobs
   *
   * @returns {X86Compiler}
   * @memberof X86Compiler
   */
  compile(): X86Compiler {
    const {nodes, _blobSet} = this;

    this._offset = 0;
    _blobSet.clear();

    R.forEach(
      (node) => {
        switch (node.kind) {
          case ASTNodeKind.INSTRUCTION:
            this.emitBlob(
              new BinaryInstruction(<ASTInstruction> node).compile(this),
            );
            break;

          case ASTNodeKind.DEFINE:
            break;

          default:
            throw new ParserError(ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION);
        }
      },
      nodes,
    );

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

  // eslint-disable-next-line
  console.log(output.blobSet.toString());
}

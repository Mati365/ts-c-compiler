import * as R from 'ramda';

import {ASTAsmTree} from '../ast/ASTAsmParser';
import {BinaryLabelsOffsets} from '../ast/types';
import {BinaryBlob} from './BinaryBlob';
import {BinaryEqu} from './types/BinaryEqu';

export type BinaryBlobsMap = Map<number, BinaryBlob>;

/**
 * Contains non compiled instruction labels and node offsets
 *
 * @export
 * @class FirstPassResult
 */
export class FirstPassResult {
  constructor(
    public readonly tree: ASTAsmTree,
    public readonly labels: BinaryLabelsOffsets = new Map<string, number>(),
    public readonly equ: Map<string, BinaryEqu> = new Map,
    public readonly nodesOffsets: BinaryBlobsMap = new Map<number, BinaryBlob>(),
  ) {}

  /**
   * It is slow, maybe there will be better way?
   *
   * @returns {number}
   * @memberof FirstPassResult
   */
  getByteSize(): number {
    const array = Array.from(this.nodesOffsets);
    const lastItem = R.last(array);
    if (!lastItem)
      return 0;

    return lastItem[0] - array[0][0] + lastItem[1].byteSize;
  }
}

/**
 * Contains compiled instructions labels and offsets
 *
 * @export
 * @class SecondPassResult
 */
export class SecondPassResult {
  constructor(
    public readonly offset: number = 0,
    public labelsOffsets: BinaryLabelsOffsets = new Map,
    public blobs: BinaryBlobsMap = new Map,
    public totalPasses: number = 0,
    public byteSize: number = 0,
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
   * Reduces blobs into single array
   *
   * @returns {number[]}
   * @memberof SecondPassResult
   */
  getBinary(): number[] {
    const {byteSize, blobs} = this;
    const bin: number[] = new Array(byteSize);

    let currentOffset = 0;
    for (const [, blob] of blobs) {
      const binary = blob.getBinary();
      for (let i = 0; i < binary.length; ++i)
        bin[currentOffset + i] = binary[i];

      currentOffset += blob.byteSize;
    }

    return bin;
  }
}

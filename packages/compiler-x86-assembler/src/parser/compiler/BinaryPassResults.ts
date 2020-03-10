import * as R from 'ramda';

import {ASTTree} from '../ast/ASTParser';
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
    public readonly tree: ASTTree,
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

    return lastItem[0] - array[0][0] + lastItem[1].binary.length;
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
}

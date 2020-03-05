import * as R from 'ramda';

import {flipMap} from '@compiler/core/utils/flipMap';

import {ASTTree} from '../ast/ASTParser';
import {BinaryLabelsOffsets} from '../ast/types';
import {BinaryBlob} from './BinaryBlob';

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
    const {labelsOffsets, blobs, totalPasses} = this;
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

      const prefix = `${labelStr.padEnd(maxLabelLength + 4)}${offsetStr}: `;
      const blobStr = blob.toString(true);

      // handle multiline serialize
      const parsedLines = R.addIndex(R.map)(
        (str: string, index: number) => (
          index
            ? (`  .    ${str}`).padStart(prefix.length + str.length, ' ')
            : `${prefix}${str}`
        ),
        <string[]> blobStr,
      );

      lines.push(...parsedLines);
    }

    return `Total passes: ${totalPasses + 1}\nBinary mapping:\n\n${R.join('\n', lines)}`;
  }
}

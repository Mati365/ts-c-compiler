import * as R from 'ramda';

import {BinaryLabelsOffsets} from '../ast/types';
import {flipMap} from './utils/flipMap';
import {BinaryBlob} from './BinaryBlob';

/**
 * Contains non compiled instruction labels and node offsets
 *
 * @export
 * @class FirstPassResult
 */
export class FirstPassResult {
  constructor(
    public readonly labels: BinaryLabelsOffsets = new Map<string, number>(),
    public readonly nodesOffsets = new Map<number, BinaryBlob>(),
  ) {}
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
    public blobs: Map<number, BinaryBlob> = new Map,
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

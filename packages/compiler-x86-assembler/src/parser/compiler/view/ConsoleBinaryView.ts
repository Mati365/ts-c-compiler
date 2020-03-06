import * as R from 'ramda';

import {flipMap} from '@compiler/core/utils/flipMap';
import {
  setCharAt,
  mapMapValues,
} from '@compiler/core/utils';

import {ASTInstruction} from '../../ast/instruction/ASTInstruction';
import {BinaryView} from './BinaryView';
import {BinaryBlob} from '../BinaryBlob';

type JMPLines = Map<number, number>;

type SerializedBlobsOffsets = Map<number, string[]>;

/**
 * Prints whole binary tree like obj dump
 *
 * @export
 * @class ConsoleBinaryView
 * @extends {BinaryView<string>}
 */
export class ConsoleBinaryView extends BinaryView<string> {
  static DEFAULT_CONSOLE_TEMPLATE = Object.freeze(
    {
      horizontal: '─',
      vertical: '│',
      crossing: '┼',
      corners: {
        topLeft: '┐',
        bottomLeft: '┘',
      },
      arrows: {
        left: '◀',
      },
    },
  );

  /**
   * Draws lines over map
   *
   * @static
   * @param {SerializedBlobsOffsets} serializedOffsets
   * @param {JMPLines} jmpLines
   * @returns {string}
   * @memberof ConsoleBinaryView
   */
  static applyJmpLinesToOutput(
    serializedOffsets: SerializedBlobsOffsets,
    jmpLines: JMPLines,
  ): SerializedBlobsOffsets {
    const t = ConsoleBinaryView.DEFAULT_CONSOLE_TEMPLATE;

    const jmpLinesEntries = Array.from(jmpLines.entries());
    const minLineLength = R.reduce(
      (acc, item) => Math.max(acc, item.length),
      0,
      R.unnest(
        Array.from(serializedOffsets.values()),
      ),
    );

    const getJmpLineStr = (offset: number): string => {
      let str = '';

      for (let i = 0; i < jmpLinesEntries.length; ++i) {
        const [jmpSrc, jmpDest] = jmpLinesEntries[i];
        const toUpper = jmpDest > jmpSrc;
        const nesting = i * 2;

        str = str.padEnd(nesting, ' ');

        if (jmpSrc === offset) {
          str += `${t.horizontal}${toUpper ? t.corners.topLeft : t.corners.bottomLeft}`;
          for (let j = 0; j < str.length - 2; ++j) {
            const c = str[j];
            if (c === ' ')
              str = setCharAt(str, j, t.horizontal);
          }
        } else if (jmpDest === offset) {
          let arrowInserted = false;
          for (let j = 0; j < str.length; ++j) {
            const c = str[j];
            if (c === ' ') {
              str = setCharAt(
                str,
                j,
                arrowInserted
                  ? t.horizontal
                  : t.arrows.left,
              );
              arrowInserted = true;
            }
          }

          str += `${arrowInserted ? t.horizontal : t.arrows.left}${toUpper ? t.corners.bottomLeft : t.corners.topLeft}`;
        } else if ((!toUpper && offset < jmpSrc && offset > jmpDest)
            || (toUpper && offset > jmpSrc && offset < jmpDest))
          str += ` ${t.vertical}`;
      }

      for (let i = 0; i < str.length; ++i) {
        if (str[i] === t.vertical && str[i + 1] === t.horizontal)
          str = setCharAt(str, i, t.crossing);
      }
      return str;
    };

    return mapMapValues(
      (lines: string[], offset: number): string[] => R.map(
        (line) => `${line.padEnd(minLineLength)} ${getJmpLineStr(offset)}`,
        lines,
      ),
      serializedOffsets,
    );
  }

  /**
   * @returns {string}
   * @memberof ConsoleBinaryView
   */
  serialize(): string {
    const {compilerResult} = this;
    const {labelsOffsets, blobs, totalPasses} = compilerResult.output;

    const labelsByOffsets = flipMap(labelsOffsets);
    const maxLabelLength = R.reduce(
      (acc, label) => Math.max(acc, label.length),
      0,
      Array.from(labelsOffsets.keys()),
    );


    // reduce all blobs into lines map
    const jmpLines: JMPLines = new Map<number, number>();
    const serializedLines: SerializedBlobsOffsets = mapMapValues(
      (blob: BinaryBlob, offset: number): string[] => {
        // used for draw jump arrows
        const {ast} = blob;
        if (ast instanceof ASTInstruction
            && ast.jumpInstruction
            && ast.labeledInstruction) {
          jmpLines.set(offset, +ast.args[0].val);
        }

        const offsetStr = `0x${offset.toString(16).padStart(4, '0')}`;
        let labelStr = (labelsByOffsets.get(offset) || '');
        if (labelStr)
          labelStr = `${labelStr}:`;

        const prefix = `${labelStr.padEnd(maxLabelLength + 4)}${offsetStr}: `;
        const blobStr = blob.toString(true);

        // handle multiline serialize
        return <string[]> R.addIndex(R.map)(
          (str: string, index: number) => (
            index
              ? (`  .    ${str}`).padStart(prefix.length + str.length, ' ')
              : `${prefix}${str}`
          ),
          <string[]> blobStr,
        );
      },
      blobs,
    );

    // sum output
    const str = R.compose(
      R.join('\n'),
      R.unnest,
      Array.from,
    )(
      ConsoleBinaryView
        .applyJmpLinesToOutput(serializedLines, jmpLines)
        .values(),
    );

    return `Total passes: ${totalPasses + 1}\nBinary mapping:\n\n${str}`;
  }
}

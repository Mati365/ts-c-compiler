import * as R from 'ramda';

import {flipMap} from '@compiler/core/utils/flipMap';
import {
  setCharAt,
  mapMapValues,
} from '@compiler/core/utils';

import {CompilerError} from '@compiler/core/shared/CompilerError';
import {ASTInstruction} from '../../ast/instruction/ASTInstruction';
import {BinaryView} from './BinaryView';
import {BinaryBlob, arrayToHexString} from '../BinaryBlob';
import {CompilerFinalResult, CompilerOutput} from '../compile';

type JMPLines = Map<number, number>;

type SerializedBlobsOffsets = Map<number, string[]>;

type BinaryPrintConfig = {
  template: {
    horizontal: string,
    vertical: string,
    crossing: string,
    corners: {
      topLeft: string,
      bottomLeft: string,
    },
    arrows: {
      left: string,
      top: string,
      bottom: string,
      loopLeft: string,
      inline: {
        top: string,
        bottom: string,
      },
    },
  },
};

/**
 * Prints whole binary tree like obj dump
 *
 * @export
 * @class ConsoleBinaryView
 * @extends {BinaryView<string>}
 */
export class ConsoleBinaryView extends BinaryView<string> {
  constructor(
    compilerResult: CompilerFinalResult,
    private printConfig: BinaryPrintConfig = {
      template: {
        horizontal: '─',
        vertical: '│',
        crossing: '┼',
        corners: {
          topLeft: '╮',
          bottomLeft: '╯',
        },
        arrows: {
          left: '◀',
          top: '▲',
          bottom: '▼',
          loopLeft: '⮌',
          inline: {
            top: '⬏',
            bottom: '⬎',
          },
        },
      },
    },
  ) {
    super(compilerResult);
  }

  /**
   * Draws lines over map
   *
   * @param {SerializedBlobsOffsets} serializedOffsets
   * @param {JMPLines} jmpLines
   * @returns {string}
   * @memberof ConsoleBinaryView
   */
  applyJmpLinesToOutput(
    serializedOffsets: SerializedBlobsOffsets,
    jmpLines: JMPLines,
  ): SerializedBlobsOffsets {
    const {template: t} = this.printConfig;

    const offsetsEntries = Array.from(serializedOffsets.entries());
    const jmpLinesEntries = Array.from(jmpLines.entries());
    const minLineLength = R.reduce(
      (acc, item) => Math.max(acc, (<any> item).length),
      0,
      R.unnest(
        R.map(R.nth(1), offsetsEntries),
      ),
    );

    const getJmpLineStr = (
      offset: number,
      prevOffset: number,
      nextOffset: number,
      blobContentLine: number,
    ): string => {
      let str = '';

      for (let i = 0; i < jmpLinesEntries.length; ++i) {
        let [jmpSrc, jmpDest] = jmpLinesEntries[i];
        let infinityArrow: string = null;

        if (jmpSrc > offset && jmpSrc < nextOffset)
          jmpSrc = offset;

        // detect bottom arrow jump overflow
        if (jmpDest > offset && jmpDest < nextOffset) {
          if (nextOffset === Infinity)
            infinityArrow = t.arrows.bottom;
          else
            jmpDest = offset;
        }

        const toUpper = jmpDest > jmpSrc;
        const nesting = i * 2;
        const inArrowBody = offset >= Math.min(jmpSrc, jmpDest) && offset <= Math.max(jmpDest, jmpSrc);

        // detect top arrow jump overflow
        if (inArrowBody && !i && prevOffset === -Infinity)
          infinityArrow = t.arrows.top;

        str = str.padEnd(nesting, ' ');

        // jmp $
        if (jmpSrc === jmpDest && offset === jmpSrc)
          str += t.arrows.loopLeft;

        // ─╯ or ─╮ or ⬏ or ⬎
        else if (offset === jmpSrc && !blobContentLine) {
          let arrow = null;

          if (!toUpper && prevOffset === -Infinity)
            arrow = t.arrows.inline.top;
          else if (toUpper && nextOffset === Infinity)
            arrow = t.arrows.inline.bottom;
          else
            arrow = toUpper ? t.corners.topLeft : t.corners.bottomLeft;

          str += `${t.horizontal}${arrow}`;

          // fix nesting line
          for (let j = 0; j < str.length - 2; ++j) {
            const c = str[j];
            if (c === ' ')
              str = setCharAt(str, j, t.horizontal);
          }
        } else if (jmpDest === offset && !blobContentLine) {
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
        } else if (inArrowBody)
          str += ` ${infinityArrow ?? t.vertical}`;
      }

      for (let i = 0; i < str.length; ++i) {
        const [current, next] = [str[i], str[i + 1]];
        let replaceCharacter: string = null;

        if (current === t.vertical && next === t.horizontal)
          replaceCharacter = t.crossing;

        if (replaceCharacter !== null)
          str = setCharAt(str, i, replaceCharacter);
      }

      return str;
    };

    // do not use mapMapValues, function must known next
    // binary blob value to calculate jump margin for
    // multiline instructions
    const mapped = new Map<number, string[]>();
    for (let i = 0; i < offsetsEntries.length; ++i) {
      const [offset, lines]: [number, string[]] = offsetsEntries[i];
      const [[prevOffset], [nextOffset]] = [
        offsetsEntries[i - 1] ?? [-Infinity],
        offsetsEntries[i + 1] ?? [Infinity],
      ];

      mapped.set(
        offset,
        lines.map(
          (line, index) => `${line.padEnd(minLineLength)} ${getJmpLineStr(offset, prevOffset, nextOffset, index)}`,
        ),
      );
    }

    return mapped;
  }

  /**
   * Serialize errors
   *
   * @param {CompilerError[]} errors
   * @returns {string}
   * @memberof ConsoleBinaryView
   */
  error(errors: CompilerError[]): string {
    return R.compose(
      R.join('\n'),
      R.map(
        (error) => (
          error instanceof CompilerError
            ? error.getCompilerMessage()
            : error
        ),
      ),
    )(errors);
  }

  /**
   * Serialize success tree
   *
   * @returns {string}
   * @memberof ConsoleBinaryView
   */
  success(compilerResult: CompilerOutput): string {
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
        if (
          ast instanceof ASTInstruction
            && ast.jumpInstruction
            && !ast.memArgs.length
            && !ast.segMemArgs.length
        ) {
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
      this
        .applyJmpLinesToOutput(serializedLines, jmpLines)
        .values(),
    );

    return [
      `Total passes: ${totalPasses + 1}`,
      `Output size: ${compilerResult.output.byteSize} bytes`,
      `Binary mapping:\n\n${str}`,
      'Binary:\n',
      arrayToHexString(compilerResult.output.getBinary()),
    ].join('\n');
  }
}

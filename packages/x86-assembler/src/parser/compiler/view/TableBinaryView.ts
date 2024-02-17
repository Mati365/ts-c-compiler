import * as R from 'ramda';

import { setCharAt, mapMapValues } from '@ts-cc/core';

import { MemoryRegionRange } from '../../../constants/MemoryRegion';
import { ASTInstruction } from '../../ast/instruction/ASTInstruction';

import { CompilerError } from '@ts-cc/core';
import { BinaryView } from './BinaryView';
import { BinaryBlob } from '../BinaryBlob';
import { SecondPassResult } from '../BinaryPassResults';

type BinaryPrintConfig = {
  template: {
    horizontal: string;
    vertical: string;
    crossing: string;
    corners: {
      topLeft: string;
      bottomLeft: string;
    };
    arrows: {
      left: string;
      right: string;
      top: string;
      bottom: string;
      loopLeft: string;
      inline: {
        top: string;
        bottom: string;
      };
    };
  };
};

type JMPLines = Map<number, number>;

type JMPTableEntry = {
  offset: number;
  jmpGraph: string;
  blob: BinaryBlob;
};

type SerializedBlobsOffsets = Map<number, JMPTableEntry>;

/**
 * Prints whole binary tree like obj dump as list of strings
 */
export class TableBinaryView extends BinaryView<JMPTableEntry[]> {
  constructor(
    compilerResult: SecondPassResult,
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
          left: '<',
          right: '>',
          top: 'ʌ',
          bottom: 'v',
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
   * Compile whole instructions graph into string
   */
  static serializeToString(result: SecondPassResult): string {
    return new TableBinaryView(result)
      .serialize()
      .map(({ jmpGraph, blob, offset }) => {
        const prefix = `0x${offset.toString(16).padStart(6, '0')}  `;
        const binary = blob
          .toString()
          .map((str, index) =>
            index > 0 ? new Array(prefix.length + 1).join(' ') + str : str,
          )
          .join('\n');

        return `${prefix}${jmpGraph.padEnd(20, ' ')}${binary}`;
      })
      .join('\n');
  }

  /**
   * Draws lines over map
   */
  applyJmpLinesToOutput(
    serializedOffsets: SerializedBlobsOffsets,
    jmpLines: JMPLines,
  ): SerializedBlobsOffsets {
    const { template: t } = this.printConfig;

    const nestLevels: MemoryRegionRange[][] = [];
    const addNestLevel = (region: MemoryRegionRange): number => {
      let nesting = 0;

      for (; nesting < nestLevels.length; ++nesting) {
        const level = nestLevels[nesting];
        if (level && level.length) {
          if (!level.some(levelRegion => levelRegion.intersects(region))) {
            break;
          }
        } else {
          break;
        }
      }

      (nestLevels[nesting] = nestLevels[nesting] || []).push(region);
      return nesting;
    };

    const offsetsEntries = Array.from(serializedOffsets.entries());
    const jmpLinesEntries = Array.from(jmpLines.entries())
      .map(([low, high]) => [low, high, addNestLevel(new MemoryRegionRange(low, high))])
      .sort((a, b) => a[2] - b[2]);

    const getJmpLineStr = (
      offset: number,
      prevOffset: number,
      nextOffset: number,
      blobContentLine: number,
    ): string => {
      let str = '';

      for (let i = 0; i < jmpLinesEntries.length; ++i) {
        const entry = jmpLinesEntries[i];
        const nesting = entry[2] * 2;

        let [jmpSrc, jmpDest] = entry;
        let infinityArrow: string = null;

        if (jmpSrc > offset && jmpSrc < nextOffset) {
          jmpSrc = offset;
        }

        // detect bottom arrow jump overflow
        if (jmpDest > offset && jmpDest < nextOffset) {
          if (nextOffset === Infinity) {
            infinityArrow = t.arrows.bottom;
          } else {
            jmpDest = offset;
          }
        }

        const toUpper = jmpDest > jmpSrc;
        const inArrowBody =
          offset >= Math.min(jmpSrc, jmpDest) && offset <= Math.max(jmpDest, jmpSrc);

        // detect top arrow jump overflow
        if (inArrowBody && !i && prevOffset === -Infinity) {
          infinityArrow = t.arrows.top;
        }

        str = str.padEnd(nesting, ' ');

        // jmp $
        if (jmpSrc === jmpDest && offset === jmpSrc) {
          str += t.arrows.loopLeft;
        } else if (offset === jmpSrc && !blobContentLine) {
          // ─╯ or ─╮ or ⬏ or ⬎
          let arrow = null;

          if (!toUpper && prevOffset === -Infinity) {
            arrow = t.arrows.inline.top;
          } else if (toUpper && nextOffset === Infinity) {
            arrow = t.arrows.inline.bottom;
          } else {
            arrow = toUpper ? t.corners.topLeft : t.corners.bottomLeft;
          }

          str += `${t.horizontal}${arrow}`;

          // fix nesting line
          for (let j = 0; j < str.length - 2; ++j) {
            const c = str[j];
            if (c === ' ') {
              str = setCharAt(str, j, t.horizontal);
            }
          }
        } else if (jmpDest === offset && !blobContentLine) {
          let arrowInserted = false;
          for (let j = 0; j < str.length; ++j) {
            const c = str[j];
            if (c === ' ') {
              str = setCharAt(str, j, arrowInserted ? t.horizontal : t.arrows.left);
              arrowInserted = true;
            }
          }

          str += `${arrowInserted ? t.horizontal : t.arrows.left}${
            toUpper ? t.corners.bottomLeft : t.corners.topLeft
          }`;
        } else if (inArrowBody) {
          str += ` ${infinityArrow ?? t.vertical}`;
        }
      }

      for (let i = 0; i < str.length; ++i) {
        const [current, next] = [str[i], str[i + 1]];
        let replaceCharacter: string = null;

        if (current === t.vertical && next === t.horizontal) {
          replaceCharacter = t.crossing;
        }

        if (replaceCharacter !== null) {
          str = setCharAt(str, i, replaceCharacter);
        }
      }

      return str;
    };

    // do not use mapMapValues, function must known next
    // binary blob value to calculate jump margin for
    // multiline instructions
    const mapped = new Map<number, JMPTableEntry>();
    for (let i = 0; i < offsetsEntries.length; ++i) {
      const [offset, entry]: [number, JMPTableEntry] = offsetsEntries[i];
      const [[prevOffset], [nextOffset]] = [
        offsetsEntries[i - 1] ?? [-Infinity],
        offsetsEntries[i + 1] ?? [Infinity],
      ];

      mapped.set(offset, {
        ...entry,
        jmpGraph: getJmpLineStr(offset, prevOffset, nextOffset, 0),
      });
    }

    return mapped;
  }

  /**
   * Serialize errors
   */
  error(errors: CompilerError[]): JMPTableEntry[] {
    R.forEach(error => {
      console.error(error);
    }, errors);

    return null;
  }

  /**
   * Serialize success tree
   */
  success(compilerResult: SecondPassResult): JMPTableEntry[] {
    const { blobs } = compilerResult;

    // reduce all blobs into lines map
    const jmpLines: JMPLines = new Map<number, number>();
    const serializedLines: SerializedBlobsOffsets = mapMapValues(
      (blob: BinaryBlob, offset: number): JMPTableEntry => {
        // used for draw jump arrows
        const ast = blob.getAST();

        if (
          ast instanceof ASTInstruction &&
          ast.jumpInstruction &&
          !ast.regArgs.length &&
          !ast.memArgs.length &&
          !ast.segMemArgs.length
        ) {
          jmpLines.set(offset, +ast.args[0].val);
        }

        return {
          jmpGraph: null,
          offset,
          blob,
        };
      },
      blobs,
    );

    // sum output
    return Array.from(this.applyJmpLinesToOutput(serializedLines, jmpLines).values());
  }
}

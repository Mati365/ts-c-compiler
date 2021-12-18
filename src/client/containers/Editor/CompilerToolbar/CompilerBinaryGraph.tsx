import React, {memo, useMemo} from 'react';
import * as R from 'ramda';

import {flipMap} from '@compiler/core/utils/flipMap';
import {useI18n} from '@ui/webapp/hooks';

import {TableBinaryView} from '@compiler/x86-assembler/parser/compiler/view/TableBinaryView';
import {CompilerFinalResult} from '@compiler/x86-assembler';

import {NASM_HIGHLIGHT} from '@client/components/CodeEditor/nasmSyntaxDefine';

const HIGHLIGHT_INSTRUCTION_COLORS = {
  other: 'var(--dimmed-green)',
  addressing: 'var(--text-default)',
  register: 'var(--dimmed-blue)',
  instruction: 'var(--dimmed-purple)',
};

/**
 * Highlight blob instruction
 *
 * @see
 *  Assumes that first keyord is mnemonic!
 */
export function highlightInstructionHTML(line: string, colors = HIGHLIGHT_INSTRUCTION_COLORS): string {
  const args = line.split(' ').map(
    (keyword, index) => {
      const testKeyword = index && (
        R.endsWith(',', keyword)
          ? R.init(keyword)
          : keyword
      );

      let color = null;
      if (!index)
        color = colors.instruction;
      else if (NASM_HIGHLIGHT.registers[testKeyword])
        color = colors.register;
      else if (NASM_HIGHLIGHT.addressing[testKeyword])
        color = colors.addressing;
      else
        color = colors.other;

      return `<span style="color: ${color};">${keyword}</span>`;
    },
  );

  return args.join(' ');
}

type CompilerBinaryGraphProps = {
  result: CompilerFinalResult,
};

export const CompilerBinaryGraph = memo(({result}: CompilerBinaryGraphProps) => {
  const t = useI18n('titles.graph');
  const {output} = result.unwrap();

  const {labelsByOffsets, hasLabels} = useMemo(
    () => ({
      labelsByOffsets: flipMap(output.labelsOffsets),
      hasLabels: output.labelsOffsets.size > 0,
    }),
    [output],
  );

  const {entries, hasJumps} = useMemo(
    () => {
      const newEntries = new TableBinaryView(result).serialize();

      return {
        entries: newEntries,
        hasJumps: R.any((item) => !!item.jmpGraph, newEntries),
      };
    },
    [labelsByOffsets],
  );

  return (
    <div className='c-binary-graph'>
      <div className='c-binary-graph__list'>
        <table>
          <thead>
            <tr>
              {hasJumps && (
                <th>
                  {t('jumps')}
                </th>
              )}
              {hasLabels && (
                <th className='c-binary-graph__list-header--label'>
                  {t('label')}
                </th>
              )}
              <th className='c-binary-graph__list-header--offset'>
                {t('offset')}
              </th>
              <th className='c-binary-graph__list-header--binary'>
                {t('binary')}
              </th>
              <th className='c-binary-graph__list-header--instruction'>
                {t('instruction')}
              </th>
            </tr>
          </thead>

          <tbody>
            {entries.map(
              ({offset, jmpGraph, blob}) => {
                const label = labelsByOffsets.get(offset);

                return (
                  <tr key={offset}>
                    {hasJumps && (
                      <td className='is-jmp-graph'>
                        {jmpGraph}
                      </td>
                    )}
                    {hasLabels && (
                      <td className='is-label'>
                        {label ? `${label}:` : null}
                      </td>
                    )}
                    <td className='is-offset'>
                      {`0x${offset.toString(16).padStart(4, '0')}:`}
                    </td>
                    <td className='is-blob'>
                      {blob.toString(false)}
                    </td>
                    <td
                      className='is-instruction'
                      dangerouslySetInnerHTML={{
                        __html: highlightInstructionHTML(blob.getAST().toString()),
                      }}
                    />
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

CompilerBinaryGraph.displayName = 'CompilerBinaryGraph';

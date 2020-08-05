import React, {memo, useMemo} from 'react';
import * as R from 'ramda';

import {flipMap} from '@compiler/core/utils/flipMap';
import {useI18n} from '@ui/webapp/hooks';
import {SecondPassResult} from '@compiler/x86-assembler/parser/compiler/BinaryPassResults';

import {NASM_HIGHLIGHT} from '../../components/CodeEditor/nasmSyntaxDefine';

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

      return `<span style="color: ${color};">${keyword}</style>`;
    },
  );

  return args.join(' ');
}

type CompilerBinaryGraphProps = {
  output: SecondPassResult,
};

export const CompilerBinaryGraph = memo(({output}: CompilerBinaryGraphProps) => {
  const t = useI18n('titles.graph');

  const {labelsByOffsets, hasLabels} = useMemo(
    () => ({
      labelsByOffsets: flipMap(output.labelsOffsets),
      hasLabels: output.labelsOffsets.size > 0,
    }),
    [output],
  );

  return (
    <div className='c-binary-graph'>
      <div className='c-binary-graph__list'>
        <table>
          <thead>
            <tr>
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
            {[...output.blobs.entries()].map(
              ([offset, blob]) => {
                const label = labelsByOffsets.get(offset);

                return (
                  <tr key={offset}>
                    {hasLabels && (
                      <td>
                        {label ? `${label}:` : null}
                      </td>
                    )}
                    <td>
                      {`0x${offset.toString(16).padStart(4, '0')}:`}
                    </td>
                    <td>
                      {blob.toString(false)}
                    </td>
                    <td
                      dangerouslySetInnerHTML={{
                        __html: highlightInstructionHTML(blob.ast.toString()),
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

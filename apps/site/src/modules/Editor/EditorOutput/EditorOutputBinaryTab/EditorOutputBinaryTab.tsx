import { useMemo, memo } from 'react';
import { Table } from 'flowbite-react';
import { clsx } from 'clsx';

import { flipMap } from '@ts-cc/core';
import { TableBinaryView, type SecondPassResult } from '@ts-cc/x86-assembler';

import { useI18n } from 'i18n';
import { highlightInstructionHTML } from './utils';

type Props = {
  asmPassOutput: SecondPassResult;
};

export const EditorOutputBinaryTab = memo(({ asmPassOutput }: Props) => {
  const t = useI18n().pack.output.tabs.binary.table;
  const { labelsByOffsets, hasLabels } = useMemo(
    () => ({
      labelsByOffsets: flipMap(asmPassOutput.labelsOffsets),
      hasLabels: asmPassOutput.labelsOffsets.size > 0,
    }),
    [asmPassOutput],
  );

  const { entries, hasJumps } = useMemo(() => {
    const serializedEntries = new TableBinaryView(asmPassOutput).serialize();

    return {
      entries: serializedEntries,
      hasJumps: serializedEntries.some(item => !!item.jmpGraph),
    };
  }, [labelsByOffsets]);

  return (
    <div className="layer-absolute w-full overflow-x-auto">
      <Table theme={{ root: { shadow: '' } }}>
        <Table.Head>
          {hasLabels && <Table.HeadCell>{t.label}</Table.HeadCell>}

          <Table.HeadCell>{t.offset}</Table.HeadCell>
          <Table.HeadCell className="min-w-[105px]">{t.binary}</Table.HeadCell>
          <Table.HeadCell>{t.instruction}</Table.HeadCell>

          {hasJumps && <Table.HeadCell>{t.jumps}</Table.HeadCell>}
        </Table.Head>

        <Table.Body>
          {entries.map(({ offset, jmpGraph, blob }) => {
            const label = labelsByOffsets.get(offset);

            return (
              <Table.Row key={offset}>
                {hasLabels && (
                  <Table.Cell
                    title={label}
                    className="text-600 max-w-[150px] overflow-hidden text-ellipsis p-0
pl-2 text-cyan-700"
                  >
                    {label ? `${label}:` : null}
                  </Table.Cell>
                )}

                <Table.Cell className="p-0">
                  {`0x${offset.toString(16).padStart(4, '0')}:`}
                </Table.Cell>

                <Table.Cell className="max-w-[150px] p-0">
                  {blob.toString(false)}
                </Table.Cell>

                <Table.Cell
                  className={clsx('p-0', !hasJumps && 'pr-2')}
                  dangerouslySetInnerHTML={{
                    __html: highlightInstructionHTML(blob.ast.toString()),
                  }}
                />

                {hasJumps && (
                  <Table.Cell className="whitespace-pre-wrap p-0 pr-2 font-mono text-orange-600">
                    {jmpGraph}
                  </Table.Cell>
                )}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
});

EditorOutputBinaryTab.displayName = 'EditorOutputBinaryTab';

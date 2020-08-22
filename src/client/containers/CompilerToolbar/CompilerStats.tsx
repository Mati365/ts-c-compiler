import React, {memo} from 'react';
import * as R from 'ramda';

import {useI18n} from '@ui/webapp/hooks';

import {Tree, TreeLabeledItem} from '@ui/webapp';
import {CompilerFinalResult} from '@compiler/x86-assembler';

type CompilerStatsProps = {
  className?: string,
  result: CompilerFinalResult,
};

export const CompilerStats = memo(({result, className}: CompilerStatsProps) => {
  const t = useI18n('titles.timings');
  const {timings, output} = result.unwrap();

  const humanTimings = R.mapObjIndexed(
    (time) => time.toFixed(3),
    timings,
  );

  return (
    <Tree className={className}>
      <TreeLabeledItem
        label={t('asm.header')}
        bold
      >
        <Tree nested>
          <TreeLabeledItem
            label={t('asm.passes')}
            value={output.totalPasses}
          />

          <TreeLabeledItem
            label={t('asm.size')}
            value={`${output.byteSize}B`}
          />

          <TreeLabeledItem
            label={t('asm.total')}
            value={`${humanTimings.total} ms`}
          >
            <Tree nested>
              <TreeLabeledItem
                label={t('asm.preprocessor')}
                value={`${humanTimings.preprocessor} ms`}
              />
              <TreeLabeledItem
                label={t('asm.lexer')}
                value={`${humanTimings.lexer} ms`}
              />
              <TreeLabeledItem
                label={t('asm.ast')}
                value={`${humanTimings.ast} ms`}
              />
              <TreeLabeledItem
                label={t('asm.compiler')}
                value={`${humanTimings.compiler} ms`}
              />
            </Tree>
          </TreeLabeledItem>
        </Tree>
      </TreeLabeledItem>
    </Tree>
  );
});

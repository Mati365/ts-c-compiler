import * as R from 'ramda';

import { IRFlatCodeSegmentBuilderResult } from '../../generator';
import { optimizeInstructionsBlock } from '../block';

export function optimizeCodeSegment(
  segment: IRFlatCodeSegmentBuilderResult,
): IRFlatCodeSegmentBuilderResult {
  return {
    ...segment,
    functions: R.mapObjIndexed(
      fn => ({
        ...fn,
        block: optimizeInstructionsBlock(fn.block),
      }),
      segment.functions,
    ),
  };
}

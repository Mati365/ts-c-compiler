import * as R from 'ramda';

import {IRCodeSegmentBuilderResult} from '@compiler/pico-c/frontend/ir/generator';
import {optimizeInstructionsBlock} from '../block';

export function optimizeCodeSegment(segment: IRCodeSegmentBuilderResult): IRCodeSegmentBuilderResult{
  return {
    ...segment,
    blocks: R.mapObjIndexed(
      optimizeInstructionsBlock,
      segment.blocks,
    ),
  };
}

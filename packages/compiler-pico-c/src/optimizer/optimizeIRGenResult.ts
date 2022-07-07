import {IRScopeGeneratorResult} from '../frontend/ir/generator/emitters';
import {IROptimizerConfig} from './constants/types';
import {optimizeCodeSegment} from './segment/optimizeCodeSegment';

export function optimizeIRGenResult(
  {
    enabled,
  }: IROptimizerConfig,
  ir: IRScopeGeneratorResult,
): IRScopeGeneratorResult {
  if (!enabled)
    return ir;

  const {segments} = ir;
  return {
    ...ir,
    segments: {
      ...ir.segments,
      code: optimizeCodeSegment(segments.code),
    },
  };
}

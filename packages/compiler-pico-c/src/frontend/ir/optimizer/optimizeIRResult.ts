import { IRScopeGeneratorResult } from '../generator/emitters';
import { IROptimizerConfig } from './constants/types';
import { optimizeCodeSegment } from './segment/optimizeCodeSegment';

export function optimizeIRResult(
  { enabled }: IROptimizerConfig,
  ir: IRScopeGeneratorResult,
): IRScopeGeneratorResult {
  if (!enabled) {
    return ir;
  }

  const { segments } = ir;
  return {
    ...ir,
    segments: {
      ...ir.segments,
      code: optimizeCodeSegment(segments.code),
    },
  };
}

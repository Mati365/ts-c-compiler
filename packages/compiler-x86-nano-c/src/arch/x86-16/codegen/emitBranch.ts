import {safeArray} from '@compiler/core/utils';

import {
  EmitterListResult,
  EmitterResult,
} from '../constants/types';

import {emitInstructionsBlock} from './emitInstructionsBlock';
import {emitComment} from './emitComment';
import {emitLabel, EmitterLabelResult} from './emitLabel';
import {emitInstruction} from './emitInstruction';

type BranchEmitterConfig = {
  expressionEmitter(ifFalseLabel: string): EmitterListResult,
  ifTrueEmitter(): EmitterListResult,
  ifFalseEmitter?(): EmitterListResult,
};

/**
 * Emits single if elese statement (else is optional)
 *
 * @export
 * @param {BranchEmitterConfig} {
 *     expressionEmitter,
 *     ifTrueEmitter,
 *     ifFalseEmitter,
 *   }
 * @returns {EmitterResult}
 */
export function emitBranch(
  {
    expressionEmitter,
    ifTrueEmitter,
    ifFalseEmitter,
  }: BranchEmitterConfig,
): EmitterResult {
  const labels = {
    ifFalseLabel: <EmitterLabelResult> null,
    ifFinallyLabel: emitLabel(),
  };

  labels.ifFalseLabel = (
    ifFalseEmitter
      ? emitLabel()
      : labels.ifFinallyLabel
  );

  return {
    code: emitInstructionsBlock(
      null,
      [
        emitComment('If stmt start'),
        ...safeArray(
          expressionEmitter(labels.ifFalseLabel.uuid),
        ),
        emitComment('True:'),
        ...safeArray(
          ifTrueEmitter(),
        ),
        ...(
          ifFalseEmitter
            ? [
              emitComment('False:'),
              emitInstruction('jmp', labels.ifFinallyLabel),
              ...safeArray(ifFalseEmitter()),
            ]
            : []
        ),
        labels.ifFinallyLabel,
        emitComment('If stmt end'),
      ],
    ),
  };
}

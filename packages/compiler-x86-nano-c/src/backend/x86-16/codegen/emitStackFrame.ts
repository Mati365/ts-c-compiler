import * as R from 'ramda';

import {safeArray} from '@compiler/core/utils';
import {emitInstruction, EmitterResult, EmitterListResult} from './emitInstruction';
import {emitInstructionsBlock} from './emitInstructionsBlock';
import {emitComment} from './emitComment';

type StackFrameField = {
  size: number,
};

type StackFrameFields = Record<string, StackFrameField>;
type StackFrameFieldsOffsets = Record<string, number>;

type StackFrameConfig = {
  args?: StackFrameFields,
  variables?: StackFrameFields,
  contentEmitter?(offsets: StackFrameOffsets): EmitterListResult,
};

type StackFrameOffsets = {
  args: StackFrameFieldsOffsets,
  vars: StackFrameFieldsOffsets,
};

type StackFrameEmitterResult = EmitterResult & {
  offsets: StackFrameOffsets,
};

/**
 * Sums all variables byte size
 *
 * @param {StackFrameFields} fields
 * @returns
 */
function totalStackFrameVarsSize(fields: StackFrameFields) {
  return R.sum(
    R.pluck('size', R.values(fields)),
  );
}

/**
 * Emits CDECL stack frame
 *
 * @see
 *  stackArgsOffsets and stackVarsOffsets are relative to BP!
 *
 * @todo
 *  Add support for multiple types of stack frames?
 *
 * @export
 * @param {StackFrameConfig} config
 */
export function emitStackFrame(
  {
    args = {},
    variables = {},
    contentEmitter,
  }: StackFrameConfig,
): StackFrameEmitterResult {
  const totalArgsSize = totalStackFrameVarsSize(args);
  const totalVarsSize = totalStackFrameVarsSize(variables);

  const {offsets: bpArgsOffsets} = R.reduce(
    (acc, item) => {
      acc.currentOffset += item[1].size;
      acc.offsets[item[0]] = acc.currentOffset;
      return acc;
    },
    {
      offsets: <StackFrameFieldsOffsets> {},
      currentOffset: 2,
    },
    R.toPairs(args),
  );

  const {offsets: bpVarsOffsets} = R.reduce(
    (acc, item) => {
      acc.currentOffset -= item[1].size;
      acc.offsets[item[0]] = acc.currentOffset;
      return acc;
    },
    {
      offsets: <StackFrameFieldsOffsets> {},
      currentOffset: 0,
    },
    R.toPairs(variables),
  );

  const offsets: StackFrameOffsets = {
    args: bpArgsOffsets,
    vars: bpVarsOffsets,
  };

  // HEADER
  const instructions: EmitterResult[] = [
    emitComment('Stack frame start'),
    emitInstruction('push', 'bp'),
    emitInstruction('mov', 'bp', 'sp'),
    totalVarsSize > 0
      ? emitInstruction('sub', 'sp', totalVarsSize)
      : null,
  ];

  // CONTENT
  if (contentEmitter) {
    instructions.push(
      ...safeArray(contentEmitter(offsets)),
    );
  }

  // FOOTER
  instructions.push(
    emitInstruction('mov', 'sp', 'bp'),
    emitInstruction('pop', 'bp'),
    emitInstruction('ret', totalArgsSize || null),
    emitComment('Stack frame end'),
  );

  return {
    code: emitInstructionsBlock(null, instructions),
    offsets,
  };
}

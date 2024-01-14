import * as R from 'ramda';

import { CCompilerArch } from '#constants';
import {
  CPrimitiveType,
  CType,
  CVariableInitializerTree,
} from 'frontend/analyze';

import { X86CompileInstructionOutput } from '../shared';
import {
  genDefConst,
  genLabel,
  getDefConstSizeLabel,
} from '../../../asm-utils';

import {
  getBaseTypeIfArray,
  getBaseTypeIfPtr,
} from 'frontend/analyze/types/utils';

type ArrayInitializerDefAsmAttrs = {
  asmLabel: string;
  initializer: CVariableInitializerTree;
  arch: CCompilerArch;
  destType: CType;
};

export function compileArrayInitializerDefAsm({
  asmLabel,
  initializer,
  arch,
  destType,
}: ArrayInitializerDefAsmAttrs) {
  const { baseType } = initializer;
  const isArrayInitializer = baseType.isArray();

  // [1, 2, "as", 3] -> [[1, 2], "as", [3]]
  const groupedDefs = initializer.fields.reduce(
    ({ prevFieldType, groups }, item) => {
      const currentFieldType = typeof item?.value;

      if (currentFieldType !== prevFieldType) {
        groups.push([]);
      }

      R.last(groups).push(item?.value);

      return {
        prevFieldType: currentFieldType,
        groups,
      };
    },
    {
      prevFieldType: null,
      groups: [],
    },
  ).groups;

  const genPtrLiteralLabel = (name: string) =>
    `${getDefConstSizeLabel(
      CPrimitiveType.address(arch).getByteSize(),
    )} ${name}`;

  const genLiteralLabel = (index: number, offset: number) =>
    `${asmLabel}@str$${index}_${offset}`;

  //  [[1, 2], "as", [3]] -> 'db 1, 2' 'dw ptr "as"' 'db 3'
  const asm = groupedDefs.reduce<{ pre: string[]; post: string[] }>(
    (acc, group, index) => {
      if (typeof group[0] === 'string') {
        for (let i = 0; i < group.length; ++i) {
          if (
            isArrayInitializer &&
            getBaseTypeIfArray(getBaseTypeIfPtr(destType)).isPointer()
          ) {
            const strStringLabel = genLiteralLabel(index, i);

            acc.pre.push(genPtrLiteralLabel(strStringLabel));
            acc.post.push(
              `${genLabel(strStringLabel, false)} ${genDefConst({
                size: 1,
                values: [group[i]],
              })}`,
            );
          } else {
            acc.post.push(genDefConst({ size: 1, values: [group[i]] }));
          }
        }
      } else {
        acc.pre.push(
          genDefConst({
            size: initializer.getSingleItemByteSize(),
            values: group,
          }),
        );
      }

      return acc;
    },
    {
      pre: [],
      post: [],
    },
  );

  return X86CompileInstructionOutput.ofInstructions([
    genLabel(asmLabel, false),
    ...asm.pre,
    ...asm.post,
  ]);
}

import * as R from 'ramda';

import { CCompilerArch } from '@compiler/pico-c/constants';
import {
  CPrimitiveType,
  CVariableInitializerTree,
} from '@compiler/pico-c/frontend/analyze';

import {
  genDefConst,
  genLabel,
  getDefConstSizeLabel,
} from '../../../asm-utils';

type ArrayInitializerDefAsmAttrs = {
  asmLabel: string;
  initializer: CVariableInitializerTree;
  arch: CCompilerArch;
};

export function compileArrayInitializerDefAsm({
  asmLabel,
  initializer,
  arch,
}: ArrayInitializerDefAsmAttrs) {
  const singleItemSize = initializer.getSingleItemByteSize();
  const ptrTypeSize = CPrimitiveType.address(arch).getByteSize();

  // [1, 2, "as", 3] -> [[1, 2], "as", [3]]
  const groupedDefs = initializer.fields.reduce(
    ({ prevFieldType, groups }, field) => {
      const currentFieldType = typeof field;

      if (currentFieldType !== prevFieldType) {
        groups.push([]);
      }

      R.last(groups).push(field);

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

  //  [[1, 2], "as", [3]] -> 'db 1, 2' 'dw ptr "as"' 'db 3'
  const asm = groupedDefs.reduce<{ pre: string[]; post: string[] }>(
    (acc, group, index) => {
      if (typeof group[0] === 'string') {
        for (let i = 0; i < group.length; ++i) {
          const strStringLabel = `${asmLabel}@allocated$${index}_${i}`;

          acc.post.push(
            `${genLabel(strStringLabel, false)} ${genDefConst(1, [group[i]])}`,
          );

          acc.pre.push(
            `${getDefConstSizeLabel(ptrTypeSize)} ${strStringLabel}`,
          );
        }
      } else {
        acc.pre.push(genDefConst(singleItemSize, group));
      }

      return acc;
    },
    {
      pre: [],
      post: [],
    },
  );

  return [genLabel(asmLabel, false), ...asm.pre, ...asm.post];
}

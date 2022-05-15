import {Result, err, ok} from '@compiler/core/monads';

import {CScopeTree} from '../analyze';
import {CIRGeneratorConfig} from './constants';
import {CIRError, CIRErrorCode} from './errors/CIRError';
import {CIRGeneratorVisitor} from './generator/CIRGeneratorVisitor';

type IRCodeBuilderResult = {
  code: any[];
};

export function safeBuildIRCode(
  config: CIRGeneratorConfig,
  tree: CScopeTree,
): Result<IRCodeBuilderResult, CIRError[]> {
  try {
    new CIRGeneratorVisitor(config).visit(tree);

    return ok(
      {
        code: [],
      },
    );
  } catch (e) {
    e.code = e.code ?? CIRErrorCode.GENERATOR_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}

import {Result, err, ok} from '@compiler/core/monads';

import {CScopeTree} from '../analyze';
import {CIRGeneratorConfig} from './constants';
import {CIRError, CIRErrorCode} from './errors/CIRError';
import {
  CIRGeneratorScopeVisitor,
  CIRBranchesBuilderResult,
} from './generator';

export type IRCodeBuilderResult = {
  branches: CIRBranchesBuilderResult,
};

export function safeBuildIRCode(
  config: CIRGeneratorConfig,
  tree: CScopeTree,
): Result<IRCodeBuilderResult, CIRError[]> {
  try {
    const branches = new CIRGeneratorScopeVisitor(config).visit(tree).flush();

    return ok(
      {
        branches,
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

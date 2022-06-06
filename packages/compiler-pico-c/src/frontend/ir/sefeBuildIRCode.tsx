import {Result, err, ok} from '@compiler/core/monads';

import {CScopeTree} from '../analyze';
import {IRGeneratorConfig} from './constants';
import {IRError, IRErrorCode} from './errors/IRError';
import {
  IRGeneratorScopeVisitor,
  IRBranchesBuilderResult,
} from './generator';

export type IRCodeBuilderResult = {
  branches: IRBranchesBuilderResult,
};

export function safeBuildIRCode(
  config: IRGeneratorConfig,
  tree: CScopeTree,
): Result<IRCodeBuilderResult, IRError[]> {
  try {
    const branches = new IRGeneratorScopeVisitor(config).visit(tree).flush();

    return ok(
      {
        branches,
      },
    );
  } catch (e) {
    e.code = e.code ?? IRErrorCode.GENERATOR_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}

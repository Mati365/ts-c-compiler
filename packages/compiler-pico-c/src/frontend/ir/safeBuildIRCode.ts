import {Result, err, ok} from '@compiler/core/monads';

import {CScopeTree} from '../analyze';
import {IRGeneratorConfig} from './constants';
import {IRError, IRErrorCode} from './errors/IRError';
import {IRScopeGeneratorResult} from './generator/emitters';
import {IRGeneratorGlobalVisitor} from './generator';

export type IRCodeBuilderResult = IRScopeGeneratorResult;

export function safeBuildIRCode(
  config: IRGeneratorConfig,
  tree: CScopeTree,
): Result<IRCodeBuilderResult, IRError[]> {
  try {
    const result = new IRGeneratorGlobalVisitor(config).visit(tree).flush();

    return ok(result);
  } catch (e) {
    e.code = e.code ?? IRErrorCode.GENERATOR_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}

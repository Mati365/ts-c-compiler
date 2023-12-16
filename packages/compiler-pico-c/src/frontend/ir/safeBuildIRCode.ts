import * as E from 'fp-ts/Either';

import { CScopeTree } from '../analyze';
import { IRGeneratorConfig } from './constants';
import { IRError, IRErrorCode } from './errors/IRError';
import { IRScopeGeneratorResult } from './generator/emitters';
import { IRGeneratorGlobalVisitor } from './generator';

import { optimizeIRResult } from './optimizer';

export type IRCodeBuilderResult = IRScopeGeneratorResult;

export const safeBuildIRCode =
  (config: IRGeneratorConfig) =>
  (scope: CScopeTree): E.Either<IRError[], IRCodeBuilderResult> => {
    try {
      // console.info(CScopePrintVisitor.serializeToString(scope));

      const ir = new IRGeneratorGlobalVisitor(config).visit(scope).flush();
      const optimizedIr = optimizeIRResult(config.optimization, ir);

      return E.right(optimizedIr);
    } catch (e) {
      e.code = e.code ?? IRErrorCode.GENERATOR_ERROR;

      return E.left([e]);
    }
  };

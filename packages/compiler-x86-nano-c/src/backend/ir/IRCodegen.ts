import {Result} from '@compiler/core/monads/Result';
import {IRCodegenError} from './IRCodegenError';
import {IRInstruction} from './IRInstruction';

type IRCodegenResult = {
  code: string,
};

export abstract class IRCodegen {
  abstract process(instructions: IRInstruction[]): Result<IRCodegenResult, IRCodegenError[]>;
}

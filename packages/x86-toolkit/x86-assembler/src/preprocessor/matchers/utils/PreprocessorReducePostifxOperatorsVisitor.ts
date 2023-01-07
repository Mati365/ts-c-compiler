import { ReducePostfixOperatorsVisitor } from '@compiler/grammar/visitors/ReducePostifxOperatorsVisitor';
import { ASTPreprocessorKind } from '../../constants';

export class PreprocessorReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTPreprocessorKind.BinaryOperator);
  }
}

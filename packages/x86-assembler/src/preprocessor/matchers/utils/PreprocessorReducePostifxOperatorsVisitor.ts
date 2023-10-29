import { ReducePostfixOperatorsVisitor } from '@ts-c/grammar';
import { ASTPreprocessorKind } from '../../constants';

export class PreprocessorReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTPreprocessorKind.BinaryOperator);
  }
}

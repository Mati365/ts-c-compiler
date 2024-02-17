import { ReducePostfixOperatorsVisitor } from '@ts-cc/grammar';
import { ASTPreprocessorKind } from '../../constants';

export class PreprocessorReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTPreprocessorKind.BinaryOperator);
  }
}

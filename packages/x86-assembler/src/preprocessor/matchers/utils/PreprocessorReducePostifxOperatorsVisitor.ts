import { ReducePostfixOperatorsVisitor } from '@ts-c-compiler/grammar';
import { ASTPreprocessorKind } from '../../constants';

export class PreprocessorReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTPreprocessorKind.BinaryOperator);
  }
}

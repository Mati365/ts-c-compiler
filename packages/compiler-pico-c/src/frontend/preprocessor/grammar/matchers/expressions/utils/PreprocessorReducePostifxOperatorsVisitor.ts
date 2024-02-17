import { ReducePostfixOperatorsVisitor } from '@ts-cc/grammar';
import { ASTCPreprocessorKind } from 'frontend/preprocessor/ast';

export class PreprocessorReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTCPreprocessorKind.BinaryOperator);
  }
}

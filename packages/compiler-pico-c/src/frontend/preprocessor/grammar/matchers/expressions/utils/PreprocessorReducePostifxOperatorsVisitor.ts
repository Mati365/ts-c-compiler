import { ReducePostfixOperatorsVisitor } from '@ts-c-compiler/grammar';
import { ASTCPreprocessorKind } from 'frontend/preprocessor/ast';

export class PreprocessorReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTCPreprocessorKind.BinaryOperator);
  }
}

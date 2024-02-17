import { ReducePostfixOperatorsVisitor } from '@ts-cc/grammar';
import { ASTCCompilerKind } from '../../../ast/ASTCCompilerNode';

export class CReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTCCompilerKind.BinaryOperator);
  }
}

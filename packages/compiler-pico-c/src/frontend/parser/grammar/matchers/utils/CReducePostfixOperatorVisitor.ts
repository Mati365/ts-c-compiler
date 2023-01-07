import { ReducePostfixOperatorsVisitor } from '@compiler/grammar/visitors/ReducePostifxOperatorsVisitor';
import { ASTCCompilerKind } from '../../../ast/ASTCCompilerNode';

export class CReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTCCompilerKind.BinaryOperator);
  }
}

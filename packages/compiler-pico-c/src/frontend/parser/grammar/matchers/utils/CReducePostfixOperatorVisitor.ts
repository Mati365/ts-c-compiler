import { ReducePostfixOperatorsVisitor } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind } from '../../../ast/ASTCCompilerNode';

export class CReducePostfixOperatorsVisitor extends ReducePostfixOperatorsVisitor {
  constructor() {
    super(ASTCCompilerKind.BinaryOperator);
  }
}

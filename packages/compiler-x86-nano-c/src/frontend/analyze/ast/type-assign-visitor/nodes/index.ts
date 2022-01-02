import {NewableASTCTypeCreator} from './ASTCTypeCreator';
import {ASTCPrimaryExpressionTypeCreator} from './ASTCPrimaryExpressionTypeCreator';
import {ASTCPostfixExpressionTypeCreator} from './ASTCPostfixExpressionTypeCreator';
import {ASTCAssignmentExpressionTypeCreator} from './ASTCAssignmentExpressionTypeCreator';
import {ASTCExpressionTypeCreator} from './ASTCExpressionTypeCreator';

export * from './ASTCTypeCreator';

export const ASTC_TYPE_CREATORS: NewableASTCTypeCreator[] = [
  ASTCPrimaryExpressionTypeCreator,
  ASTCPostfixExpressionTypeCreator,
  ASTCAssignmentExpressionTypeCreator,
  ASTCExpressionTypeCreator,
];

import {NewableASTCTypeCreator} from './ASTCTypeCreator';
import {ASTCPrimaryExpressionTypeCreator} from './ASTCPrimaryExpressionTypeCreator';
import {ASTCPostfixExpressionTypeCreator} from './ASTCPostfixExpressionTypeCreator';
import {ASTCAssignmentExpressionTypeCreator} from './ASTCAssignmentExpressionTypeCreator';
import {ASTCExpressionTypeCreator} from './ASTCExpressionTypeCreator';
import {ASTCBinaryOpTypeCreator} from './ASTCBinaryOpTypeCreator';
import {ASTCReturnStmtTypeCreator} from './ASTCReturnStmtTypeCreator';
import {ASTCDeclarationTypeCreator} from './ASTCDeclarationTypeCreator';
import {ASTCFunctionDefTypeCreator} from './ASTCFunctionDefTypeCreator';
import {ASTCCastExpressionTypeCreator} from './ASTCCastExpressionTypeCreator';

export * from './ASTCTypeCreator';

export const ASTC_TYPE_CREATORS: NewableASTCTypeCreator[] = [
  ASTCPrimaryExpressionTypeCreator,
  ASTCPostfixExpressionTypeCreator,
  ASTCAssignmentExpressionTypeCreator,
  ASTCExpressionTypeCreator,
  ASTCBinaryOpTypeCreator,
  ASTCReturnStmtTypeCreator,
  ASTCDeclarationTypeCreator,
  ASTCFunctionDefTypeCreator,
  ASTCCastExpressionTypeCreator,
];

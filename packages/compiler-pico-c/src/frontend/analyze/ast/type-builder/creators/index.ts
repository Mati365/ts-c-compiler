import { NewableASTCTypeCreator } from './ASTCTypeCreator';
import { ASTCPrimaryExpressionTypeCreator } from './ASTCPrimaryExpressionTypeCreator';
import { ASTCPostfixExpressionTypeCreator } from './ASTCPostfixExpressionTypeCreator';
import { ASTCAssignmentExpressionTypeCreator } from './ASTCAssignmentExpressionTypeCreator';
import { ASTCExpressionTypeCreator } from './ASTCExpressionTypeCreator';
import { ASTCBinaryOpTypeCreator } from './ASTCBinaryOpTypeCreator';
import { ASTCReturnStmtTypeCreator } from './ASTCReturnStmtTypeCreator';
import { ASTCDeclarationTypeCreator } from './ASTCDeclarationTypeCreator';
import { ASTCFunctionDefTypeCreator } from './ASTCFunctionDefTypeCreator';
import { ASTCCastExpressionTypeCreator } from './ASTCCastExpressionTypeCreator';
import { ASTCCastUnaryExpressionTypeCreator } from './ASTCCastUnaryExpressionTypeCreator';
import { ASTCUnaryExpressionTypeCreator } from './ASTCUnaryExpressionTypeCreator';
import { ASTCInitializerTypeCreator } from './ASTCInitializerTypeCreator';
import { ASTCIfStmtTypeCreator } from './ASTCIfStmtTypeCreator';
import { ASTCForStmtTypeCreator } from './ASTCForStmtTypeCreator';
import { ASTCWhileStmtTypeCreator } from './ASTCWhileStmtTypeCreator';
import { ASTCDoWhileStmtTypeCreator } from './ASTCDoWhileStmtTypeCreator';

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
  ASTCCastUnaryExpressionTypeCreator,
  ASTCUnaryExpressionTypeCreator,
  ASTCInitializerTypeCreator,
  ASTCIfStmtTypeCreator,
  ASTCForStmtTypeCreator,
  ASTCWhileStmtTypeCreator,
  ASTCDoWhileStmtTypeCreator,
];

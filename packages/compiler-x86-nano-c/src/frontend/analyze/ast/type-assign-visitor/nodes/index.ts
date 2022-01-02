import {NewableASTCTypeCreator} from './ASTCTypeCreator';
import {ASTCPrimaryExpressionTypeCreator} from './ASTCPrimaryExpressionTypeCreator';

export * from './ASTCTypeCreator';

export const ASTC_TYPE_CREATORS: NewableASTCTypeCreator[] = [
  ASTCPrimaryExpressionTypeCreator,
];

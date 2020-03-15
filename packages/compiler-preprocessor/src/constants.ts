import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {Grammar} from '@compiler/grammar/Grammar';

export enum PreprocessorIdentifier {
  DEFINE,
  MACRO,
  ENDMACRO,
  IF,
  ENDIF,
}

export enum ASTPreprocessorKind {
  DefineStmt = 'DefineStmt',
  IfStmt = 'IfStmt',
  MacroStmt = 'MacroStmt',
  SyntaxStmt = 'SyntaxStmt',
  LogicExpression = 'LogicExpression',

  // Math
  Value = 'Value',
  BinaryOperator = 'BinaryOperator',
}

export class PreprocessorGrammar extends Grammar<PreprocessorIdentifier, ASTPreprocessorKind> {}

export class ASTPreprocessorNode extends TreeNode<ASTPreprocessorKind> {}

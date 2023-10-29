import { TreeNode } from '@ts-c/grammar';
import { Grammar } from '@ts-c/grammar';
import {
  PreprocessorInterpretable,
  InterpreterResult,
  PreprocessorInterpreter,
} from './interpreter/PreprocessorInterpreter';

export enum PreprocessorIdentifier {
  DEFINE,
  IDEFINE,
  MACRO,
  IMACRO,
  ENDMACRO,
  IF,
  IFN,
  IFDEF,
  IFNDEF,
  ENDIF,
  ELSE,
  ELIF,
  ELIFN,
  ELIFDEF,
  ELIFNDEF,
  UNDEF,
}

export enum ASTPreprocessorKind {
  Stmt = 'Stmt',
  EquStmt = 'EquStmt',
  DefineStmt = 'DefineStmt',
  UndefStmt = 'UndefStmt',
  IfStmt = 'IfStmt',
  IfDefStmt = 'IfDefStmt',
  MacroStmt = 'MacroStmt',
  SyntaxStmt = 'SyntaxStmt',

  // Expresisons
  LogicExpression = 'LogicExpression',

  // Math operators
  Value = 'Value',
  BinaryOperator = 'BinaryOperator',
}

/**
 * Checks if node kind is statement
 */
export function isStatementPreprocessorNode(
  node: ASTPreprocessorNode,
): boolean {
  switch (node.kind) {
    case ASTPreprocessorKind.Stmt:
    case ASTPreprocessorKind.DefineStmt:
    case ASTPreprocessorKind.UndefStmt:
    case ASTPreprocessorKind.EquStmt:
    case ASTPreprocessorKind.IfStmt:
    case ASTPreprocessorKind.IfDefStmt:
    case ASTPreprocessorKind.MacroStmt:
    case ASTPreprocessorKind.SyntaxStmt:
      return true;

    default:
      return false;
  }
}

export class PreprocessorGrammar extends Grammar<
  PreprocessorIdentifier,
  ASTPreprocessorKind
> {}

export class ASTPreprocessorNode
  extends TreeNode<ASTPreprocessorKind>
  implements PreprocessorInterpretable
{
  /* eslint-disable @typescript-eslint/no-unused-vars */
  toEmitterLine(interpreter?: PreprocessorInterpreter): string {
    return '';
  }

  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

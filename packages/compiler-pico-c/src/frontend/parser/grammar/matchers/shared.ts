import type { Grammar } from '@ts-c-compiler/grammar';
import type { CCompilerIdentifier } from '#constants';
import type {
  ASTCStmt,
  ASTCUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDeclarator,
  ASTCAbstractDeclarator,
  ASTCSpecifiersQualifiersList,
  ASTCInitializer,
  ASTCForStatement,
  ASTCWhileStatement,
  ASTCDoWhileStatement,
  ASTCSwitchStatement,
  ASTCDeclaration,
} from '../../ast';

export type CGrammarTypedefEntry = {
  name: string;
  node: ASTCDeclaration;
};

export type CGrammarDef = Grammar<CCompilerIdentifier, ASTCCompilerKind>;

export type CGrammar = {
  parentNode: {
    loopStmt?: ASTCForStatement | ASTCWhileStatement | ASTCDoWhileStatement;
    switchStmt?: ASTCSwitchStatement;
  };

  g: CGrammarDef;
  declarator(): ASTCDeclarator;
  abstractDeclarator(): ASTCAbstractDeclarator;
  statement(): ASTCStmt;
  unaryExpression(): ASTCUnaryExpression;
  assignmentExpression(): ASTCCompilerNode;
  qualifiersSpecifiers(): ASTCSpecifiersQualifiersList;
  initializer(): ASTCInitializer;
  registerDeclaration(decl: ASTCDeclaration): void;
  getTypedefEntry(name: string): CGrammarTypedefEntry;
};

import { Grammar, GrammarInitializer } from '@ts-c-compiler/grammar';
import { SyntaxError } from '@ts-c-compiler/grammar';
import { GroupTreeVisitor } from '@ts-c-compiler/grammar';

import { CCompilerIdentifier } from '#constants';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ast/ASTCCompilerNode';

import {
  CGrammar,
  CGrammarTypedefEntry,
  qualifiersSpecifiers,
  assignmentExpression,
  unaryExpression,
  declarator,
  abstractDeclarator,
  statement,
  translationUnit,
  initializer,
  compoundExpressionStatement,
} from './matchers';

import type { ASTCDeclaration, ASTCDirectDeclarator } from '../ast';

/**
 * @see {@link https://www.lysator.liu.se/c/ANSI-C-grammar-y.html}
 * @see {@link https://cs.wmich.edu/~gupta/teaching/cs4850/sumII06/The%20syntax%20of%20C%20in%20Backus-Naur%20form.htm}
 */
const compilerMatcher: GrammarInitializer<
  CCompilerIdentifier,
  ASTCCompilerKind
> = ({ g }) => {
  const typedefNodes: Record<string, CGrammarTypedefEntry> = {};

  const registerDeclaration = (node: ASTCDeclaration) => {
    if (!node.specifier.storageClassSpecifiers?.isTypedef()) {
      return node;
    }

    node.initList.children.forEach(item => {
      if (item.initializer) {
        throw new SyntaxError();
      }

      GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
        [ASTCCompilerKind.TypeSpecifier]: false,
        [ASTCCompilerKind.DirectDeclaratorFnExpression]: false,
        [ASTCCompilerKind.DirectDeclarator]: {
          enter(declaratorNode: ASTCDirectDeclarator) {
            if (!declaratorNode.isIdentifier()) {
              return;
            }

            const name = declaratorNode.identifier.text;
            typedefNodes[name] = {
              name,
              node,
            };

            return false;
          },
        },
      })(item);
    });
  };

  const grammar: CGrammar = {
    parentNode: {},
    g,
    declarator: () => declarator(grammar),
    abstractDeclarator: () => abstractDeclarator(grammar),
    statement: () => statement(grammar),
    compoundExpressionStatement: () => compoundExpressionStatement(grammar),
    unaryExpression: () => unaryExpression(grammar),
    assignmentExpression: () => assignmentExpression(grammar),
    qualifiersSpecifiers: () => qualifiersSpecifiers(grammar),
    initializer: () => initializer(grammar),
    getTypedefEntry: (name: string) => typedefNodes[name],
    registerDeclaration,
  };

  return () => translationUnit(grammar);
};

export const createCCompilerGrammar = () =>
  Grammar.build(
    {
      ignoreMatchCallNesting: true,
    },
    compilerMatcher,
  );

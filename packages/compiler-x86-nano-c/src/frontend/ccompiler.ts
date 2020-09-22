import {ok} from '@compiler/core/monads/Result';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {TreePrintVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {createCCompilerGrammar} from './cgrammar';
import {clexer, CLexerConfig} from './clexer';

type CCompilerConfig = {
  lexer?: CLexerConfig,
};

/**
 * Output of compilation
 *
 * @export
 * @class CCompilerResult
 */
export class CCompilerResult {
  constructor(
    public readonly code: string,
    public readonly ast: TreeNode,
  ) {}

  dump() {
    const {ast, code} = this;

    console.info(`Source:\n${code}`);
    console.info(TreePrintVisitor.valueOf(ast));
  }
}
/**
 * Main compiler entry, compiles code to binary
 *
 * @see
 *  Flow:
 *  Lexer -> ASTGenerator -> ASTIRCompiler -> X86CodeGen
 *
 * @export
 * @param {CCompilerConfig} ccompilerConfig
 * @param {string} code
 * @returns
 */
export function ccompiler(ccompilerConfig: CCompilerConfig, code: string) {
  ccompilerConfig = ccompilerConfig || {};

  return clexer(ccompilerConfig.lexer, code)
    .andThen((tokens) => ok(createCCompilerGrammar().process(tokens)))
    .andThen((ast) => ok(new CCompilerResult(code, ast)));
}

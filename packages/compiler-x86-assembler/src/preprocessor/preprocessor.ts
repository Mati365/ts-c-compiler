/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {TokenType, NumberToken} from '@compiler/lexer/tokens';
import {Grammar, GrammarInitializer} from '@compiler/grammar/Grammar';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

enum PreprocessorIdentifier {
  MACRO,
  ENDMACRO,
}

class ASTPreprocessorMacro extends TreeNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly argsCount: number,
  ) {
    super(loc);
  }
}

const preprocessorMatcher: GrammarInitializer<PreprocessorIdentifier> = ({m, grammar}) => {
  /**
   * matches %macro
   *
   * @returns {TreeNode}
   */
  function macro(): TreeNode {
    const startToken = m(PreprocessorIdentifier.MACRO);
    const [name, argsCount] = [
      m(null, TokenType.KEYWORD).text,
      (<NumberToken> m(null, TokenType.NUMBER)).value.number,
    ];

    m(PreprocessorIdentifier.ENDMACRO);

    return new ASTPreprocessorMacro(
      NodeLocation.fromTokenLoc(startToken.loc),
      name,
      argsCount,
    );
  }

  function empty(): TreeNode {
    grammar.consume();
    return null;
  }

  return {
    macro,
    empty,
  };
};

const grammar = Grammar.build(
  {
    identifiers: {
      '%macro': PreprocessorIdentifier.MACRO,
      '%endmacro': PreprocessorIdentifier.ENDMACRO,
    },
  },
  preprocessorMatcher,
);

console.info(
  grammar.process(`
    %macro dupa 3
    %endmacro
  `),
);

import * as R from 'ramda';

import {format} from '@compiler/core/utils/format';

export type LangHydrate = {
  pack: LangPack,
  lang: string,
};

export type Lang = 'pl' | 'en';

export type LangPack = {[key in Lang]: object};

export type LangTranslateFn = {
  (path: string, params?: object): string,
  lang?: Lang,
  supportedLangs?: string[],
  setCurrentLang?: (lang: string) => void,
};

export type LangTranslator = {
  pack: LangPack,
  createTranslator: (lang: string, fallbackLang: string) => LangTranslateFn,
};

const stringLens = R.compose(
  R.lensPath,
  R.split('.'),
);

export const createLangCache = () => ({
  lenses: {},
  resolvedKeys: {},
});

/**
 * Creates pack that returns translator factory
 *
 * @export
 * @param {LangPack} pack
 * @returns {LangTranslator}
 */
export function createLangPack(pack: LangPack): LangTranslator {
  const {
    resolvedKeys,
    lenses,
  } = createLangCache();

  return {
    pack,

    // translator behaves as same as format()
    createTranslator: (lang: Lang, fallbackLang: string = 'en') => {
      // try to load fallback if current language is not present
      let {[lang]: langPack} = pack;
      if (!langPack)
        langPack = pack[fallbackLang];

      if (!langPack)
        throw new Error('Cannot find lang!');

      const translate = (path: string, params: object, overrideLang: string = null) => {
        let templateStr = resolvedKeys[path];

        // if no params - we can cache it!
        if (!params && templateStr)
          return templateStr;

        // lookup for lens in cache
        let lens = lenses[path];
        if (!lens) {
          lens = stringLens(path);
          lenses[path] = lens;
        }

        // cache template
        templateStr = R.view(lens, overrideLang ? pack[overrideLang] : langPack);
        if (templateStr !== undefined)
          resolvedKeys[templateStr] = templateStr;
        else {
          if (overrideLang === null)
            return translate(path, params, fallbackLang);

          templateStr = '';
        }

        if (!params)
          return templateStr;

        return format(templateStr, params);
      };

      return translate;
    },
  };
}

import {useContext} from 'react';

import {I18nContext} from '../ProvideI18n';
import {LangTranslateFn} from '../utils/createLangPack';

/**
 * Creates function that translates using path
 *
 * @export
 * @param {string} scope Path to be prepended to translate path
 * @returns {LangTranslateFn}
 */
export function useI18n(scope?: string): LangTranslateFn {
  const translator = useContext(I18nContext);
  if (!scope)
    return translator;

  const t: LangTranslateFn = (path: string, params?: object) => (
    translator(`${scope}.${path}`, params) || translator(path, params)
  );

  t.lang = translator.lang;
  t.supportedLangs = translator.supportedLangs;
  t.setCurrentLang = translator.setCurrentLang;

  return t;
}

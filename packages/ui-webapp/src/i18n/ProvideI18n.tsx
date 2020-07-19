import React, {useMemo, ReactNode, useState} from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import * as R from 'ramda';

import {useUpdateEffect} from '../hooks/useUpdateEffect';
import {createLangPack, LangPack, Lang} from './utils/createLangPack';

export const LANG_SETTING_COOKIE = 'app-lang';

type LangProviderProps = {
  lang: Lang,
  fallbackLang: string,
  translations: LangPack,
  children: ReactNode,
};

export const I18nContext = React.createContext(null);

export const ProvideI18n = ({
  children, translations,
  lang, fallbackLang,
}: LangProviderProps) => {
  const [currentLang, setCurrentLang] = useState<string>(lang);
  const translator = useMemo(
    () => {
      const t = createLangPack(translations).createTranslator(currentLang, fallbackLang);

      t.supportedLangs = R.keys(translations) as string[];
      t.lang = currentLang as Lang;
      t.setCurrentLang = setCurrentLang;

      return t;
    },
    [currentLang, translations],
  );

  // write cookie cache
  useUpdateEffect(
    () => {
      if (currentLang)
        Cookies.set(LANG_SETTING_COOKIE, currentLang, {expires: new Date('2300-01-01')});
    },
    [currentLang],
  );

  return (
    <I18nContext.Provider value={translator}>
      {children}
    </I18nContext.Provider>
  );
};

ProvideI18n.displayName = 'ProvideI18n';

ProvideI18n.propTypes = {
  translations: PropTypes.objectOf(PropTypes.any),
  lang: PropTypes.string,
  fallbackLang: PropTypes.string,
};

ProvideI18n.defaultProps = {
  translations: {},
  lang: 'en',
  fallbackLang: 'en',
};

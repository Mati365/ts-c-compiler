import constate from 'constate';
import { I18N_PACKS } from './packs';

const useI18nValue = () => ({
  pack: I18N_PACKS.en,
});

export const [I18nProvider, useI18n] = constate(useI18nValue);

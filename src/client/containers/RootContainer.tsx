import React from 'react';

import {APP_I18N} from '@client/i18n/pack';

import {ProvideI18n} from '@ui/webapp/i18n/ProvideI18n';
import {EmulatorContextProvider} from '@client/context/emulator-state/context';
import {EditorContainer} from './Editor/EditorContainer';

export const RootContainer = () => (
  <ProvideI18n translations={APP_I18N}>
    <EmulatorContextProvider>
      <EditorContainer />
    </EmulatorContextProvider>
  </ProvideI18n>
);

RootContainer.displayName = 'RootContainer';

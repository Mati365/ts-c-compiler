/// <reference path="../types.d.ts" />

import './styles/index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import {ProvideI18n} from '@ui/webapp/i18n/ProvideI18n';
import {RootContainer} from './containers/RootContainer';
import {EmulatorContextProvider} from './context/emulator-state/context';

import {APP_I18N} from './i18n/pack';

ReactDOM.render(
  <ProvideI18n translations={APP_I18N}>
    <EmulatorContextProvider>
      <RootContainer />
    </EmulatorContextProvider>
  </ProvideI18n>,
  document.getElementById('react-root'),
);

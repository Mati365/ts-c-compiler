/// <reference path="../types.d.ts" />

import './styles/index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import {RootContainer} from './containers/RootContainer';
import {EmulatorContextProvider} from './context/emulator-state/context';

ReactDOM.render(
  <EmulatorContextProvider>
    <RootContainer />
  </EmulatorContextProvider>,
  document.getElementById('react-root'),
);

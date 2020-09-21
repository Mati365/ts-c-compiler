/// <reference path="../types.d.ts" />

import './styles/index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import '@compiler/x86-nano-c';

import {RootContainer} from './containers/RootContainer';

ReactDOM.render(
  <RootContainer />,
  document.getElementById('react-root'),
);

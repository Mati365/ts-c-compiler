import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppContainer } from './App';

const container = document.body.appendChild(document.createElement('div'));

const root = createRoot(container);
root.render(<AppContainer />);

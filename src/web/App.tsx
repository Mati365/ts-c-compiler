import React from 'react';
import { EditorContainer } from './editor';
import { SiteLayoutContainer } from './layout';

export const AppContainer = () => (
  <SiteLayoutContainer>
    <EditorContainer />
  </SiteLayoutContainer>
);

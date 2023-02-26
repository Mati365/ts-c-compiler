import React, { PropsWithChildren } from 'react';
import { createGlobalStyle } from 'styled-components';
import { SiteLayoutHolder } from './SiteLayout.styled';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }

  :root {
    box-sizing: border-box;
    font-family: Arial;
    line-height: 1.5;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }
`;

export const SiteLayoutContainer = ({ children }: PropsWithChildren) => (
  <>
    <GlobalStyle />
    <SiteLayoutHolder>{children}</SiteLayoutHolder>
  </>
);

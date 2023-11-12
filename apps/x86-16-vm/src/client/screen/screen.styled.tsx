import { styled } from 'styled-components';

export const ScreenWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: grid;
  place-content: center;
`;

export const ScreenCanvasWrapper = styled.div`
  display: block;
  margin: 0 auto;
  text-align: center;
  image-rendering: pixelated;
`;

import {useEffect, useLayoutEffect} from 'react';
import {isSsrMode} from '../utils/isSsrMode';

export const useIsomorphicLayoutEffect = isSsrMode ? useEffect : useLayoutEffect;

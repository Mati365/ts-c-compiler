import { useState } from 'react';
import type { DependencyList } from 'react';

import { shallowCompareArrays } from '../helpers';

export const useInstantUpdateEffect = (fn: VoidFunction, deps: DependencyList) => {
  const [prevDeps, setPrevDeps] = useState(deps);

  if (prevDeps && !shallowCompareArrays(prevDeps, deps)) {
    setPrevDeps(deps);
    fn();
  }
};

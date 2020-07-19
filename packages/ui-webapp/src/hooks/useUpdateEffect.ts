import {useRef, useEffect, EffectCallback} from 'react';

export const useUpdateEffect = (effect: EffectCallback, dependencies: React.DependencyList = []) => {
  const isInitialMount = useRef(true);

  useEffect(
    () => {
      if (isInitialMount.current)
        isInitialMount.current = false;
      else
        effect();
    },
    dependencies,
  );
};

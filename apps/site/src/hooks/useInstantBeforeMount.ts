import { useRef } from 'react';

export const useInstantBeforeMount = (fn: VoidFunction) => {
  const executedRef = useRef(false);

  if (!executedRef.current) {
    executedRef.current = true;
    fn();
  }
};

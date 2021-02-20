/* eslint-disable react-hooks/rules-of-hooks */

import { useEffect, useReducer, useRef } from "react";

import { get } from "./shared";
import { Observer, Path, StateConfig } from "./types";
import { warn } from "./utils";

const useFormState = (path: Path, { formId, ...rest }: StateConfig): any => {
  const methodName = "useFormState";

  if (!formId) {
    warn(
      `💡 react-cool-form > ${methodName}: Missing the "formId" option. See: TBD`
    );
    return undefined;
  }

  const methods = get(formId);

  if (!methods) {
    warn(
      `💡 react-cool-form > ${methodName}: You must provide the corresponding ID to the form hook. See: TBD`
    );
    return undefined;
  }

  const { getFormState, subscribeObserver, unsubscribeObserver } = methods;
  const [, forceUpdate] = useReducer((c) => c + 1, 0);
  const observerRef = useRef<Observer>();

  useEffect(() => {
    // @ts-expect-error
    subscribeObserver(observerRef.current);

    // @ts-expect-error
    return () => unsubscribeObserver(observerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return getFormState(path, {
    ...rest,
    methodName,
    callback: (usedState) => {
      if (!observerRef.current)
        observerRef.current = { usedState, update: forceUpdate };
    },
  });
};

export default useFormState;

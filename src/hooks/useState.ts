import { useReducer, useRef, useCallback } from "react";
import isEqual from "fast-deep-equal";

import {
  Debug,
  FormState,
  FormStateReturn,
  Map,
  SetDefaultValuesRef,
  SetStateRef,
  SetUsedStateRef,
} from "../types";
import useLatest from "./useLatest";
import { get, getIsDirty, isEmptyObject, set } from "../utils";

export default <V>(
  initialState: FormState<V>,
  onChange?: Debug<V>
): FormStateReturn<V> => {
  const [, forceUpdate] = useReducer((c) => c + 1, 0);
  const defaultValuesRef = useRef(initialState.values);
  const stateRef = useRef(initialState);
  const usedStateRef = useRef<Map>({});
  const onChangeRef = useLatest(onChange || (() => undefined));

  const setStateRef = useCallback<SetStateRef>(
    (path, value, { fieldPath, shouldUpdate = true } = {}) => {
      const key = path.split(".")[0];

      if (!key) {
        if (!isEqual(stateRef.current, value)) {
          stateRef.current = value;
          forceUpdate();
          onChangeRef.current(stateRef.current);
        }

        return;
      }

      if (key === "values" || !isEqual(get(stateRef.current, path), value)) {
        const state = set(stateRef.current, path, value, true);
        const {
          errors,
          dirtyFields,
          isDirty: prevIsDirty,
          isValid: prevIsValid,
        } = state;
        let { submitCount: prevSubmitCount } = state;
        const isDirty =
          key === "dirtyFields" ? getIsDirty(dirtyFields) : prevIsDirty;
        const isValid = key === "errors" ? isEmptyObject(errors) : prevIsValid;
        const submitCount =
          key === "isSubmitting" && value
            ? (prevSubmitCount += 1)
            : prevSubmitCount;

        stateRef.current = { ...state, isDirty, isValid, submitCount };

        path = fieldPath || path;

        if (
          shouldUpdate &&
          (Object.keys(usedStateRef.current).some(
            (key) => path.startsWith(key) || key.startsWith(path)
          ) ||
            (usedStateRef.current.isDirty && isDirty !== prevIsDirty) ||
            (usedStateRef.current.isValid && isValid !== prevIsValid))
        ) {
          forceUpdate();
          onChangeRef.current(stateRef.current);
        }
      }
    },
    [onChangeRef]
  );

  const setUsedStateRef = useCallback<SetUsedStateRef>((path) => {
    usedStateRef.current[path] = true;
  }, []);

  const setDefaultValuesRef = useCallback<SetDefaultValuesRef<V>>((values) => {
    defaultValuesRef.current = values;
  }, []);

  return { stateRef, setStateRef, setUsedStateRef, setDefaultValuesRef };
};
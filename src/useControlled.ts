import {
  ControlledConfig,
  ControlledReturn,
  FieldProps,
  FormValues,
} from "./types";
import * as shared from "./shared";
import { get, isFieldElement, isUndefined, warn } from "./utils";
import useFormState from "./useFormState";

export default <V = FormValues, E extends any[] = any[]>(
  name: string,
  {
    formId,
    defaultValue,
    validate,
    parse,
    format,
    errorWithTouched,
    exclude,
    ...props
  }: ControlledConfig<V>
): ControlledReturn<E> => {
  if (__DEV__ && !name)
    throw new Error(
      '💡 react-cool-form > useControlled: Missing the "name" parameter.'
    );

  if (__DEV__ && !formId)
    throw new Error(
      '💡 react-cool-form > useControlled: Missing the "formId" option. See: https://react-cool-form.netlify.app/docs/api-reference/use-controlled#formid'
    );

  const methods = shared.get(formId);

  if (__DEV__ && !methods)
    throw new Error(
      '💡 react-cool-form > useControlled: You must provide the corresponding ID to the "useForm" hook. See: https://react-cool-form.netlify.app/docs/api-reference/use-form#id'
    );

  const meta = useFormState(
    {
      value: `values.${name}`,
      error: `errors.${name}`,
      isTouched: `touched.${name}`,
      isDirty: `dirty.${name}`,
    },
    { formId, errorWithTouched }
  );
  const {
    excludeFieldsRef,
    controllersRef,
    fieldValidatorsRef,
    defaultValuesRef,
    changedFieldRef,
    getNodeValue,
    setDefaultValue,
    setTouchedMaybeValidate,
    handleChangeEvent,
    ...restMethods
  } = methods;

  let fieldProps: FieldProps<E>;

  if (exclude) {
    excludeFieldsRef.current[name] = true;
  } else {
    controllersRef.current[name] = true;
    if (validate) fieldValidatorsRef.current[name] = validate;

    let dfValue = get(defaultValuesRef.current, name);
    dfValue = !isUndefined(dfValue) ? dfValue : defaultValue;
    if (!isUndefined(defaultValue)) setDefaultValue(name, dfValue);

    const { onChange, onBlur, ...restProps } = props;

    fieldProps = {
      name,
      value: (format ? format(meta.value) : meta.value) ?? "",
      onChange: (...args) => {
        let val;

        if (parse) {
          val = parse(...args);
        } else {
          const e = args[0];
          val =
            e?.nativeEvent instanceof Event && isFieldElement(e.target)
              ? getNodeValue(name)
              : e;
        }

        handleChangeEvent(name, val);
        if (onChange) onChange(...args);
        changedFieldRef.current = name;
      },
      onBlur: (e) => {
        setTouchedMaybeValidate(name);
        if (onBlur) onBlur(e);
        changedFieldRef.current = undefined;
      },
      ...restProps,
    };
  }

  return { fieldProps, meta, ...restMethods };
};

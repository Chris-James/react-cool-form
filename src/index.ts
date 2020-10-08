import { useRef, useCallback, useEffect } from "react";

import {
  Config,
  Return,
  FormValues,
  Fields,
  FieldElement,
  SetFieldValue,
} from "./types";
import useLatest from "./useLatest";
import useFormState from "./useFormState";
import {
  warn,
  get,
  isNumberField,
  isRangeField,
  isCheckboxField,
  isRadioField,
  isMultipleSelectField,
  isFileField,
  isFunction,
  isObject,
  isArray,
  isNullOrUndefined,
} from "./utils";

const isFieldElement = ({ tagName }: HTMLElement) =>
  /INPUT|TEXTAREA|SELECT/.test(tagName);

const hasChangeEvent = ({ type }: HTMLInputElement) =>
  !/hidden|image|submit|reset/.test(type);

const getFields = (form: HTMLFormElement | null) =>
  form
    ? [...form.querySelectorAll("input,textarea,select")]
        .filter((element) => {
          const field = element as FieldElement;
          if (!field.name)
            warn('💡react-cool-form: Field is missing "name" attribute');
          return field.name && hasChangeEvent(field as HTMLInputElement);
        })
        .reduce((fields, field) => {
          const { type, name } = field as FieldElement;
          fields[name] = { ...fields[name], field };
          if (/checkbox|radio/.test(type)) {
            fields[name].options = fields[name].options
              ? [...fields[name].options, field]
              : [field];
          }
          return fields;
        }, {} as Record<string, any>)
    : {};

const useForm = <V extends FormValues = FormValues>({
  defaultValues,
  formRef: configFormRef,
  validate,
  validateOnChange = true,
  validateOnBlur = true,
}: Config<V>): Return<V> => {
  const defaultValuesRef = useLatest(defaultValues || {});
  const validateRef = useLatest(validate);
  const fieldsRef = useRef<Fields>({});
  const changedFieldRef = useRef("");
  const [formState, stateRef, setStateRef] = useFormState<V>(
    defaultValuesRef.current
  );
  const varFormRef = useRef<HTMLFormElement>(null);
  const formRef = configFormRef || varFormRef;

  const refreshFieldsIfNeeded = useCallback(
    (name: string) => {
      if (formRef.current && !fieldsRef.current[name])
        fieldsRef.current = getFields(formRef.current);
    },
    [formRef]
  );

  const validateForm = useCallback(async () => {
    if (!formRef.current || !validateRef.current) return;

    setStateRef("isValidating", true);

    try {
      const errors = await validateRef.current(stateRef.current.values);

      if (!isNullOrUndefined(errors)) setStateRef("errors", errors);
      setStateRef("isValidating", false);
    } catch (error) {
      warn(`💡react-cool-form > validate form: `, error);
    }
  }, [formRef, validateRef, stateRef, setStateRef]);

  const setDomValue = useCallback((name: string, value: any) => {
    if (!fieldsRef.current[name]) return;

    const { field, options } = fieldsRef.current[name];

    if (isCheckboxField(field)) {
      const checkboxs = options as HTMLInputElement[];

      if (checkboxs.length > 1) {
        checkboxs.forEach((checkbox) => {
          checkbox.checked = isArray(value)
            ? value.includes(checkbox.value)
            : !!value;
        });
      } else {
        checkboxs[0].checked = !!value;
      }
    } else if (isRadioField(field)) {
      (options as HTMLInputElement[]).forEach((radio) => {
        radio.checked = radio.value === value;
      });
    } else if (isMultipleSelectField(field) && isArray(value)) {
      [...field.options].forEach((option) => {
        option.selected = !!value.includes(option.value);
      });
    } else if (isFileField(field)) {
      if (isObject(value)) field.files = value;
    } else {
      field.value = value;
    }
  }, []);

  const setFieldTouched = useCallback(
    (name: string, shouldValidate = validateOnBlur) => {
      refreshFieldsIfNeeded(name);

      setStateRef(`touched.${name}`, true);
      if (shouldValidate && name !== changedFieldRef.current) validateForm();
    },
    [refreshFieldsIfNeeded, setStateRef, validateOnBlur, validateForm]
  );

  const setFieldValue = useCallback<SetFieldValue>(
    (name, value, shouldValidate = validateOnChange) => {
      const val = isFunction(value)
        ? value(get(stateRef.current.values, name))
        : value;

      setStateRef(`values.${name}`, val);
      refreshFieldsIfNeeded(name);
      setDomValue(name, val);
      setFieldTouched(name, false);

      if (shouldValidate) validateForm();
    },
    [
      validateOnChange,
      refreshFieldsIfNeeded,
      stateRef,
      setStateRef,
      setDomValue,
      setFieldTouched,
      validateForm,
    ]
  );

  const applyValuesToDom = useCallback(
    (
      fields: Fields = getFields(formRef.current),
      values: V = defaultValuesRef.current
    ) =>
      Object.keys(fields).forEach((key) => {
        const { name } = fields[key].field;
        setDomValue(name, get(values, name));
      }),
    [formRef, defaultValuesRef, setDomValue]
  );

  useEffect(() => {
    if (!formRef.current) {
      warn(
        '💡react-cool-form: Don\'t forget to register your form via the "formRef"'
      );
      return;
    }

    fieldsRef.current = getFields(formRef.current);
    applyValuesToDom(fieldsRef.current);
  }, [formRef, applyValuesToDom]);

  useEffect(() => {
    if (!formRef.current) return () => null;

    const handleChange = (e: Event) => {
      const field = e.target as FieldElement;
      const { name, value } = field;

      if (!name) {
        warn('💡react-cool-form: Field is missing "name" attribute');
        return;
      }

      let val: any = value;

      if (isNumberField(field) || isRangeField(field)) {
        val = parseFloat(value) || "";
      } else if (isCheckboxField(field)) {
        let checkValues: any = get(stateRef.current.values, name);

        if (field.hasAttribute("value") && isArray(checkValues)) {
          checkValues = new Set(checkValues);

          if (field.checked) {
            checkValues.add(value);
          } else {
            checkValues.delete(value);
          }

          val = [...checkValues];
        } else {
          val = field.checked;
        }
      } else if (isMultipleSelectField(field)) {
        val = [...field.options]
          .filter((option) => option.selected)
          .map((option) => option.value);
      } else if (isFileField(field)) {
        val = field.files;
      }

      setStateRef(`values.${name}`, val);

      if (validateOnChange) validateForm();
      changedFieldRef.current = name;
    };

    const handleBlur = ({ target }: Event) => {
      if (
        isFieldElement(target as HTMLElement) &&
        hasChangeEvent(target as HTMLInputElement)
      ) {
        setFieldTouched((target as FieldElement).name);
        changedFieldRef.current = "";
      }
    };

    const form = formRef.current;

    form.addEventListener("input", handleChange);
    form.addEventListener("focusout", handleBlur);

    return () => {
      form.removeEventListener("input", handleChange);
      form.removeEventListener("focusout", handleBlur);
    };
  }, [
    formRef,
    stateRef,
    setStateRef,
    validateOnChange,
    validateForm,
    setFieldTouched,
  ]);

  return { formRef, formState, setFieldValue };
};

export default useForm;

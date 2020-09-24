import { useRef, useCallback, useEffect } from "react";

import {
  Options,
  Return,
  FormActionType,
  Fields,
  FieldValues,
  FieldElement,
  Values,
  SetValues,
} from "./types";
import useFormState from "./useFormState";
import {
  isCheckbox,
  isRadio,
  isMultipleSelect,
  isFile,
  isString,
  isArray,
} from "./utils";

const warnNoFieldName = () => {
  if (__DEV__)
    console.warn('💡react-cool-form: Field is missing "name" attribute');
};

const getFields = (form: HTMLFormElement | null) =>
  form
    ? [...form.querySelectorAll("input,textarea,select")]
        .filter((element) => {
          const { name, type } = element as FieldElement;
          if (!name) warnNoFieldName();
          return name && !/hidden|image|submit|reset/.test(type);
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

const useForm = <T extends FieldValues = FieldValues>({
  defaultValues = {},
}: Options = {}): Return<T> => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fieldsRef = useRef<Fields>({});
  const valuesRef = useRef<Values<T>>(defaultValues);
  const [state, dispatch] = useFormState<T>(defaultValues, (values) => {
    valuesRef.current = values;
  });

  const setFieldValue = useCallback((name: string, value: any) => {
    const { field, options } = fieldsRef.current[name];

    if (!field) return;

    if (isCheckbox(field)) {
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
    } else if (isRadio(field)) {
      (options as HTMLInputElement[]).forEach((radio) => {
        radio.checked = radio.value === value;
      });
    } else if (isMultipleSelect(field) && isArray(value)) {
      [...(field as HTMLSelectElement).options].forEach((option) => {
        option.selected = !!value.includes(option.value);
      });
    } else if (isFile(field) && !isString(value)) {
      (field as HTMLInputElement).files = value;
    } else {
      field.value = value;
    }
  }, []);

  const setValues = useCallback<SetValues<T>>(
    (nameOrValues, value) => {
      let payload;

      if (isString(nameOrValues)) {
        const name = nameOrValues as string;
        payload = { [name]: value };
        setFieldValue(name, value);
      } else {
        payload = nameOrValues;
        // TODO: set multiple values
      }

      dispatch({ type: FormActionType.SET_VALUES, payload });
      // TODO: form validation
    },
    [setFieldValue, dispatch]
  );

  const setFormStateValue = useCallback(
    (name: string, value: any) => setValues(name, value),
    [setValues]
  );

  const setDefaultValues = useCallback(
    (fields: Fields = getFields(formRef.current)) =>
      Object.keys(fields).forEach((key) => {
        const { name } = fields[key].field;
        setFieldValue(name, defaultValues[name]);
      }),
    [setFieldValue, defaultValues]
  );

  useEffect(() => {
    if (!formRef.current) {
      if (__DEV__)
        console.warn(
          '💡react-cool-form: Don\'t forget to register your form with the "formRef"'
        );
      return;
    }

    fieldsRef.current = getFields(formRef.current);
    setDefaultValues(fieldsRef.current);
  }, [setDefaultValues]);

  useEffect(() => {
    if (!formRef.current) return () => null;

    const form = formRef.current;

    const handleChange = (e: Event) => {
      const field = e.target as FieldElement;
      const { name, value } = field;

      if (!name) {
        warnNoFieldName();
        return;
      }

      let val: any = value;

      if (isCheckbox(field)) {
        const checkbox = field as HTMLInputElement;

        if (checkbox.hasAttribute("value")) {
          const checkValues = new Set(valuesRef.current[name]);

          if (checkbox.checked) {
            checkValues.add(value);
          } else {
            checkValues.delete(value);
          }

          val = [...checkValues];
        } else {
          val = checkbox.checked;
        }
      } else if (isMultipleSelect(field)) {
        val = [...(field as HTMLSelectElement).options]
          .filter((option) => option.selected)
          .map((option) => option.value);
      } else if (isFile(field)) {
        val = (field as HTMLInputElement).files;
      }

      setFormStateValue(name, val);
    };

    form.addEventListener("input", handleChange);

    return () => {
      form.removeEventListener("input", handleChange);
    };
  }, [setFormStateValue]);

  return { formRef, values: state.values, errors: state.errors, setValues };
};

export default useForm;

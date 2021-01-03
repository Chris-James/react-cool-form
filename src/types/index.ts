import { FocusEvent, MutableRefObject, RefObject, SyntheticEvent } from "react";

// Common
export type Map = Record<string, boolean>;

// State
type DeepProps<V, T = any> = {
  [K in keyof V]?: V[K] extends T ? T : DeepProps<V[K]>;
};

export type FormErrors<V> = DeepProps<V>;

export interface FormState<V> {
  values: V;
  touched: DeepProps<V, boolean>;
  errors: FormErrors<V>;
  isDirty: boolean;
  dirty: DeepProps<V, boolean>;
  isValidating: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
}

export type StateRef<V> = MutableRefObject<FormState<V>>;

export interface SetStateRef {
  (
    path: string,
    value?: any,
    options?: { fieldPath?: string; shouldUpdate?: boolean }
  ): void;
}

export interface SetUsedStateRef {
  (path: string, unset?: boolean): void;
}

export interface FormStateReturn<V> {
  stateRef: StateRef<V>;
  setStateRef: SetStateRef;
  setUsedStateRef: SetUsedStateRef;
}

// Form
export type FormValues = Record<string, any>;

export type FieldElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export interface FieldsValue {
  field: FieldElement;
  options?: FieldElement[];
}

export type Fields = Record<string, FieldsValue>;

export type FieldArgs = Record<
  string,
  {
    valueAsNumber?: boolean;
    valueAsDate?: boolean;
    parse?: Parser;
  }
>;

interface Options<V> {
  formState: FormState<V>;
  setErrors: SetErrors<V>;
  setFieldError: SetFieldError;
  setValues: SetValues<V>;
  setFieldValue: SetFieldValue;
  validateForm: ValidateForm<V>;
  validateField: ValidateField;
  reset: Reset<V>;
  submit: Submit<V>;
}

interface ResetHandler<V> {
  (values: V, options: Options<V>, event?: Event | SyntheticEvent): void;
}

interface SubmitHandler<V> {
  (
    values: V,
    options: Options<V>,
    event?: Event | SyntheticEvent
  ): void | Promise<void>;
}

interface ErrorHandler<V> {
  (
    errors: FormErrors<V>,
    options: Options<V>,
    event?: Event | SyntheticEvent
  ): void;
}

export interface Debug<V> {
  (formState: FormState<V>): void;
}

interface FormValidator<V> {
  (values: V): FormErrors<V> | void | Promise<FormErrors<V> | void>;
}

export interface FieldValidator<V> {
  (value: any, values: V): any | Promise<any>;
}

export interface FieldRef<V> {
  (
    validateOrOptions:
      | FieldValidator<V>
      | {
          validate?: FieldValidator<V>;
          valueAsNumber?: boolean;
          valueAsDate?: boolean;
          parse?: Parser;
        }
  ): (field: FieldElement | null) => void;
}

export interface GetState {
  (
    path: string | string[] | Record<string, string>,
    options?: {
      target?: string;
      watch?: boolean;
      filterUntouchedError?: boolean;
    }
  ): any;
}

export interface SetErrors<V> {
  (
    errors?:
      | FormErrors<V>
      | ((previousErrors: FormErrors<V>) => FormErrors<V> | undefined)
  ): void;
}

export interface SetFieldError {
  (name: string, error?: any | ((previousError?: any) => any)): void;
}

type ValuesArg<V> = V | ((previousValues: V) => V);

interface FieldNamesFn {
  (fieldNames: string[]): string[];
}

export interface SetValues<V> {
  (
    values: ValuesArg<V>,
    options?: {
      shouldValidate?: boolean;
      touched?: string[] | FieldNamesFn;
      dirty?: string[] | FieldNamesFn;
    }
  ): void;
}

export interface SetFieldValue {
  (
    name: string,
    value?: any | ((previousValue: any) => any),
    options?: {
      [k in "shouldValidate" | "shouldTouched" | "shouldDirty"]?: boolean;
    }
  ): void;
}

export interface ValidateForm<V> {
  (): Promise<FormErrors<V>>;
}

export interface ValidateField {
  (name: string): Promise<any>;
}

export interface Reset<V> {
  (
    values?: ValuesArg<V> | null,
    exclude?: (keyof FormState<V>)[] | null,
    event?: SyntheticEvent
  ): void;
}

export interface Submit<V> {
  (event?: SyntheticEvent): Promise<{
    values?: V;
    errors?: FormErrors<V>;
  }>;
}

interface Parser {
  (...args: any[]): any;
}

interface Formatter {
  (value: any): any;
}

export interface Controller<V, E = any> {
  (
    name: string,
    options?: {
      validate?: FieldValidator<V>;
      value?: any;
      defaultValue?: any;
      parse?: Parser;
      format?: Formatter;
      onChange?: (event: E, value: any) => void;
      onBlur?: (event: FocusEvent) => void;
    }
  ): {
    name: string;
    value: any;
    onChange: (event: E) => void;
    onBlur: (event: FocusEvent) => void;
  } | void;
}

export type Config<V> = Partial<{
  defaultValues: V;
  validate: FormValidator<V>;
  validateOnChange: boolean;
  validateOnBlur: boolean;
  builtInValidationMode: "message" | "state" | false;
  shouldRemoveField: boolean;
  ignoreFields: string[];
  onReset: ResetHandler<V>;
  onSubmit: SubmitHandler<V>;
  onError: ErrorHandler<V>;
  debug: Debug<V>;
}>;

export interface Return<V> {
  form: RefObject<HTMLFormElement>;
  field: FieldRef<V>;
  getState: GetState;
  setErrors: SetErrors<V>;
  setFieldError: SetFieldError;
  setValues: SetValues<V>;
  setFieldValue: SetFieldValue;
  validateForm: ValidateForm<V>;
  validateField: ValidateField;
  reset: Reset<V>;
  submit: Submit<V>;
  controller: Controller<V>;
}

declare module "react-cool-form" {
  import { RefObject } from "react";

  export type FormValues = Record<string, any>;

  type Prop<V, T = any> = { [K in keyof V]?: V[K] extends T ? T : Prop<V[K]> };

  type Touched<V> = Prop<V, boolean>;

  type Errors<V> = Prop<V>;

  interface Set {
    (object: any, path: string, value?: unknown, immutable?: boolean): any;
  }

  export interface FormState<V = FormValues> {
    readonly values: V;
    readonly touched: Touched<V>;
    readonly errors: Errors<V>;
    readonly isValid: boolean;
    readonly isValidating: boolean;
  }

  export interface GetFormState<T = any> {
    (path?: string): T;
  }

  export interface Validate<V = FormValues> {
    (values: V, options: { formState: FormState<V>; set: Set }):
      | Errors<V>
      | void
      | Promise<Errors<V> | void>;
  }

  export interface FieldValidateFn<V> {
    (value: any, formState: FormState<V>): any | Promise<any>;
  }

  export interface ValidateRef<V = FormValues> {
    (validateFn: FieldValidateFn<V>): (
      field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
    ) => void;
  }

  export interface SetFieldValue {
    (
      name: string,
      value: any | ((previousValue: any) => any),
      shouldValidate?: boolean
    ): void;
  }

  export interface SetFieldError {
    (name: string, error?: any | ((previousError?: any) => any)): void;
  }

  export interface Config<V = FormValues> {
    defaultValues: V;
    validate?: Validate<V>;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
  }

  export interface Return<V = FormValues> {
    formRef: RefObject<HTMLFormElement>;
    validate: ValidateRef<V>;
    formState: FormState<V>;
    getFormState: GetFormState;
    setFieldValue: SetFieldValue;
    setFieldError: SetFieldError;
    validateForm: () => void;
  }

  const useForm: <V extends FormValues = FormValues>(
    config: Config<V>
  ) => Return<V>;

  export default useForm;
}

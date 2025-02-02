/* eslint-disable react/no-unused-prop-types */

import { Dispatch, useState } from "react";
import {
  render,
  fireEvent,
  screen,
  act,
  waitFor,
} from "@testing-library/react";

import {
  FieldArrayConfig,
  FormMethods,
  Insert,
  Move,
  Push,
  Remove,
  Swap,
} from "./types";
import useForm from "./useForm";
import useFieldArray from "./useFieldArray";
import useControlled from "./useControlled";

type API = Omit<FormMethods, "form"> & {
  fields: string[];
  insert: Insert;
  move: Move;
  push: Push;
  remove: Remove;
  swap: Swap;
  show: boolean;
  setShow: Dispatch<boolean>;
};

interface Config extends FieldArrayConfig {
  children: (api: API) => JSX.Element | JSX.Element[] | null;
  isShow: boolean;
  defaultValues: any;
  shouldRemoveField: boolean;
  formValidate: (values: any) => void;
  onSubmit: (values: any) => void;
  onRender: () => void;
}

type Props = Partial<Config>;

const Form = ({
  children,
  isShow,
  formId,
  defaultValues,
  shouldRemoveField,
  formValidate,
  onSubmit = () => null,
  onRender = () => null,
  ...rest
}: Props) => {
  const [show, setShow] = useState(!!isShow);
  const { form, ...methods } = useForm({
    id: formId,
    defaultValues,
    shouldRemoveField,
    validate: formValidate,
    onSubmit: (values) => onSubmit(values),
  });
  const [fields, helpers] = useFieldArray("foo", { ...rest, formId });

  onRender();

  return (
    <form data-testid="form" ref={form}>
      {children
        ? children({
            ...methods,
            fields,
            ...helpers,
            show,
            setShow,
          })
        : null}
    </form>
  );
};

const renderHelper = ({ children, ...rest }: Props = {}) => {
  let api: API;

  const { container } = render(
    <Form {...rest}>
      {(a) => {
        api = a;
        return children ? children(a) : null;
      }}
    </Form>
  );

  // @ts-expect-error
  return { ...api, container };
};

const Field = ({ name, ...rest }: any) => {
  const [props] = useControlled(name, rest);
  return <input {...props} />;
};

const FieldArray = (props: any) => {
  const [fields] = useFieldArray("foo", props);
  return (
    <>
      {fields.map((name) => (
        <div key={name}>
          <input data-testid={`${name}.a`} name={`${name}.a`} />
          <Field data-testid={`${name}.b`} name={`${name}.b`} />
        </div>
      ))}
    </>
  );
};

describe("useFieldArray", () => {
  const getByTestId = screen.getByTestId as any;
  const onSubmit = jest.fn();
  const onRender = jest.fn();
  const value = [{ a: "🍎", b: "🍎" }];

  beforeEach(() => jest.clearAllMocks());

  it("should throw missing name error", () => {
    // @ts-expect-error
    expect(() => useFieldArray()).toThrow(
      '💡 react-cool-form > useFieldArray: Missing "name" parameter.'
    );
  });

  it("should throw form id errors", () => {
    expect(() => useFieldArray("values", { formId: "form-1" })).toThrow(
      '💡 react-cool-form > useFieldArray: It must work with an "useForm" hook. See: https://react-cool-form.netlify.app/docs/api-reference/use-form'
    );
  });

  it.each(["form", "array"])(
    "should set default value correctly from %s option",
    async (type) => {
      const { container } = renderHelper({
        defaultValues: type === "form" ? { foo: value } : undefined,
        defaultValue: type === "array" ? value : undefined,
        onSubmit,
        children: ({ fields }: API) =>
          fields.map((name) => (
            <div key={name}>
              <input data-testid={`${name}.a`} name={`${name}.a`} />
              <Field data-testid={`${name}.b`} name={`${name}.b`} />
            </div>
          )),
      });
      expect(container.querySelectorAll("input")).toHaveLength(2);
      expect(getByTestId("foo[0].a").value).toBe(value[0].a);
      expect(getByTestId("foo[0].b").value).toBe(value[0].b);
      fireEvent.submit(getByTestId("form"));
      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({ foo: value })
      );
    }
  );

  it("should use form-level default value first", async () => {
    const defaultValues = { foo: value };
    renderHelper({
      defaultValues,
      defaultValue: [{ a: "🍋" }],
      onSubmit,
    });
    fireEvent.submit(getByTestId("form"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(defaultValues));
  });

  it.each([undefined, true, value])(
    'should return "fields" correctly',
    (val) => {
      const { fields, getState } = renderHelper({
        defaultValues: { foo: val },
      });
      if (Array.isArray(val)) {
        expect(fields).toEqual(["foo[0]"]);
      } else {
        expect(fields).toEqual([]);
      }
      expect(getState("foo")).toEqual(val);
    }
  );

  it.each([{ shouldDirty: false }, { shouldTouched: true }])(
    "should push value correctly",
    async (options) => {
      const { push, container, getState } = renderHelper({
        defaultValues: { foo: value },
        onRender,
        children: ({ fields }: API) =>
          fields.map((name) => (
            <div key={name}>
              <input data-testid={`${name}.a`} name={`${name}.a`} />
              <Field data-testid={`${name}.b`} name={`${name}.b`} />
            </div>
          )),
      });
      const newValue = { a: "🍋", b: "🍋" };
      act(() => push(newValue, options));
      expect(container.querySelectorAll("input")).toHaveLength(4);
      await waitFor(() => {
        expect(getByTestId("foo[1].a").value).toBe(newValue.a);
        expect(getByTestId("foo[1].b").value).toBe(newValue.b);
      });
      expect(getState("foo")).toEqual([...value, newValue]);
      if (options?.shouldDirty === false) {
        expect(getState("dirty.foo")).toBeUndefined();
      } else {
        expect(getState("dirty.foo")).toEqual([, { a: true, b: true }]);
      }
      if (options?.shouldTouched) {
        expect(getState("touched.foo")).toEqual([, { a: true, b: true }]);
      } else {
        expect(getState("touched.foo")).toBeUndefined();
      }
      expect(onRender).toHaveBeenCalledTimes(2);
    }
  );

  it("should insert value correctly", async () => {
    const { insert, container, getState } = renderHelper({
      defaultValues: { foo: value },
      onRender,
      children: ({ fields }: API) =>
        fields.map((name) => (
          <div key={name}>
            <input data-testid={`${name}.a`} name={`${name}.a`} />
            <Field data-testid={`${name}.b`} name={`${name}.b`} />
          </div>
        )),
    });

    let val = [...value, { a: "🍋", b: "🍋" }];
    act(() => insert(1, val[1], { shouldTouched: true }));
    expect(container.querySelectorAll("input")).toHaveLength(4);
    await waitFor(() => {
      expect(getByTestId("foo[1].a").value).toBe(val[1].a);
      expect(getByTestId("foo[1].b").value).toBe(val[1].b);
    });
    expect(getState("foo")).toEqual(val);
    expect(getState("dirty.foo")).toEqual([, { a: true, b: true }]);
    expect(getState("touched.foo")).toEqual([, { a: true, b: true }]);
    expect(onRender).toHaveBeenCalledTimes(2);

    val = [...val, { a: "🥝", b: "🥝" }];
    act(() => insert(2, val[2], { shouldDirty: false }));
    expect(container.querySelectorAll("input")).toHaveLength(6);
    await waitFor(() => {
      expect(getByTestId("foo[2].a").value).toBe(val[2].a);
      expect(getByTestId("foo[2].b").value).toBe(val[2].b);
    });
    expect(getState("foo")).toEqual(val);
    expect(getState("dirty.foo")).toEqual([, { a: true, b: true }]);
    expect(getState("touched.foo")).toEqual([, { a: true, b: true }]);

    val = [{ a: "🍒", b: "🍒" }, ...val];
    act(() => insert(0, val[0], { shouldDirty: false }));
    expect(container.querySelectorAll("input")).toHaveLength(8);
    await waitFor(() => {
      expect(getByTestId("foo[0].a").value).toBe(val[0].a);
      expect(getByTestId("foo[0].b").value).toBe(val[0].b);
    });
    expect(getState("foo")).toEqual(val);
    expect(getState("dirty.foo")).toEqual([, , { a: true, b: true }]);
    expect(getState("touched.foo")).toEqual([, , { a: true, b: true }]);
  });

  it.each(["swap", "move"])("should %s values correctly", (type) => {
    const { push, swap, move, getState } = renderHelper({
      defaultValues: { foo: value },
      onRender,
      children: ({ fields }: API) =>
        fields.map((name) => (
          <div key={name}>
            <input name={`${name}.a`} />
            <Field name={`${name}.b`} />
          </div>
        )),
    });
    const newValue = { a: "🍋", b: "🍋" };
    act(() => {
      push(newValue, { shouldTouched: true });
      if (type === "swap") {
        swap(0, 1);
      } else {
        move(1, 0);
      }
    });
    expect(getState("foo")).toEqual([newValue, ...value]);
    expect(getState("touched.foo")).toEqual([{ a: true, b: true }, undefined]);
    expect(getState("dirty.foo")).toEqual([{ a: true, b: true }, undefined]);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it("should remove value correctly", () => {
    const { push, remove, getState } = renderHelper({
      onRender,
      children: ({ fields }: API) =>
        fields.map((name) => (
          <div key={name}>
            <input data-testid={`${name}.a`} name={`${name}.a`} />
            <Field data-testid={`${name}.b`} name={`${name}.b`} />
          </div>
        )),
    });
    const val = [...value, { a: "🍋", b: "🍋" }];
    act(() => {
      push(val[0], { shouldTouched: true });
      push(val[1], { shouldTouched: true });
      expect(remove(1)).toEqual(val[1]);
    });
    expect(getState("foo")).toEqual([val[0]]);
    expect(getState("dirty.foo")).toEqual([{ a: true, b: true }]);
    expect(getState("touched.foo")).toEqual([{ a: true, b: true }]);
    act(() => expect(remove(0)).toEqual(val[0]));
    expect(getState("foo")).toEqual([]);
    expect(getState("dirty.foo")).toEqual([]);
    expect(getState("touched.foo")).toEqual([]);
  });

  it.each(["set", "reset"])("should %s value correctly", (type) => {
    const defaultValue = [...value, { a: "🍋", b: "🍋" }];
    const { setValue, reset, getState, push, remove, container } = renderHelper(
      {
        defaultValues: { foo: defaultValue },
        children: ({ fields }: API) =>
          fields.map((name) => (
            <div key={name}>
              <input data-testid={`${name}.a`} name={`${name}.a`} />
              <Field data-testid={`${name}.b`} name={`${name}.b`} />
            </div>
          )),
      }
    );
    const fooA = getByTestId("foo[0].a");
    const fooB = getByTestId("foo[0].b");
    const target = { value: "🍒" };

    fireEvent.input(fooA, { target });
    fireEvent.input(fooB, { target });
    act(() => {
      if (type === "set") {
        setValue("foo", defaultValue);
      } else {
        reset();
      }
    });
    expect(fooA.value).toBe(defaultValue[0].a);
    expect(fooB.value).toBe(defaultValue[0].b);
    expect(getState("foo")).toEqual(defaultValue);
    if (type === "reset") {
      expect(getState("touched.foo")).toBeUndefined();
      expect(getState("dirty.foo")).toBeUndefined();
    }

    act(() => {
      if (type === "set") reset();
      push({ a: "🥝", b: "🥝" });
    });
    fireEvent.input(fooA, { target });
    fireEvent.input(fooB, { target });
    act(() => {
      if (type === "set") {
        setValue("foo", defaultValue);
      } else {
        reset();
      }
    });
    expect(container.querySelectorAll("input")).toHaveLength(4);
    expect(fooA.value).toBe(defaultValue[0].a);
    expect(fooB.value).toBe(defaultValue[0].b);
    expect(getState("foo")).toEqual(defaultValue);
    if (type === "reset") {
      expect(getState("touched.foo")).toBeUndefined();
      expect(getState("dirty.foo")).toBeUndefined();
    }

    act(() => {
      if (type === "set") reset();
      remove(1);
    });
    fireEvent.input(fooA, { target });
    fireEvent.input(fooB, { target });
    act(() => {
      if (type === "set") {
        setValue("foo", defaultValue);
      } else {
        reset();
      }
    });
    expect(container.querySelectorAll("input")).toHaveLength(4);
    expect(fooA.value).toBe(defaultValue[0].a);
    expect(fooB.value).toBe(defaultValue[0].b);
    expect(getState("foo")).toEqual(defaultValue);
    if (type === "reset") {
      expect(getState("touched.foo")).toBeUndefined();
      expect(getState("dirty.foo")).toBeUndefined();
    }
  });

  it.each(["form", "array"])("should run %s-level validation", async (type) => {
    const error = "Required";
    const { remove, getState } = renderHelper({
      defaultValues: { foo: value },
      formValidate:
        type === "form"
          ? ({ foo }) => (!foo.length ? { foo: error } : {})
          : undefined,
      validate:
        type === "array" ? (val) => (!val.length ? error : false) : undefined,
    });
    act(() => {
      remove(0);
    });
    await waitFor(() => expect(getState("errors.foo")).toBe(error));
  });

  describe("conditional fields", () => {
    const initialState = {
      values: {},
      touched: {},
      errors: {},
      isDirty: false,
      dirty: {},
      isValidating: false,
      isValid: true,
      isSubmitting: false,
      isSubmitted: false,
      submitCount: 0,
    };
    const formValue = value;
    const fieldValue = [{ a: "🍋", b: "🍋" }];

    it.each(["form", "array"])(
      "should set %s-level default value correctly",
      async (type) => {
        const {
          getState,
          setError,
          setTouched,
          setDirty,
          setShow,
          container,
        } = renderHelper({
          defaultValues: type === "form" ? { foo: formValue } : undefined,
          children: ({ show }: API) => (
            <>
              {show && (
                <FieldArray
                  defaultValue={type === "array" ? fieldValue : undefined}
                />
              )}
            </>
          ),
        });

        act(() => setShow(true));
        await waitFor(() => {
          expect(getState()).toEqual({
            ...initialState,
            values: { foo: type === "form" ? formValue : fieldValue },
          });
          expect(getByTestId("foo[0].a").value).toBe(
            type === "form" ? formValue[0].a : fieldValue[0].a
          );
          expect(getByTestId("foo[0].b").value).toBe(
            type === "form" ? formValue[0].b : fieldValue[0].b
          );
        });

        act(() => {
          setError("foo", [{ a: "Required", b: "Required" }]);
          setTouched("foo[0].a", true, false);
          setTouched("foo[0].b", true, false);
          setDirty("foo[0].a");
          setDirty("foo[0].b");
          setShow(false);
        });
        await waitFor(() => expect(getState()).toEqual(initialState));

        act(() => setShow(true));
        await waitFor(() => {
          expect(getState()).toEqual({
            ...initialState,
            values: { foo: type === "array" ? fieldValue : undefined },
          });
          if (type === "form") {
            expect(container.querySelectorAll("input")).toHaveLength(0);
          } else {
            expect(getByTestId("foo[0].a").value).toBe(fieldValue[0].a);
            expect(getByTestId("foo[0].b").value).toBe(fieldValue[0].b);
          }
        });
      }
    );

    it.each(["form", "array", "field"])(
      "should set %s-level default value correctly",
      async (type) => {
        const {
          getState,
          setError,
          setTouched,
          setDirty,
          setShow,
        } = renderHelper({
          defaultValues: type === "form" ? { foo: formValue } : undefined,
          defaultValue:
            // eslint-disable-next-line no-nested-ternary
            type === "array" ? fieldValue : type === "field" ? [{}] : undefined,
          children: ({ fields, show }: API) =>
            fields.map((name) => (
              <div key={name}>
                {show && (
                  <input
                    data-testid={`${name}.a`}
                    name={`${name}.a`}
                    defaultValue={
                      type === "field" ? fieldValue[0].a : undefined
                    }
                  />
                )}
                {show && (
                  <Field
                    data-testid={`${name}.b`}
                    name={`${name}.b`}
                    defaultValue={
                      type === "field" ? fieldValue[0].b : undefined
                    }
                  />
                )}
              </div>
            )),
        });

        act(() => setShow(true));
        const state = {
          ...initialState,
          values: { foo: type === "form" ? formValue : fieldValue },
        };
        await waitFor(() => {
          expect(getState()).toEqual(state);
          expect(getByTestId("foo[0].a").value).toBe(
            type === "form" ? formValue[0].a : fieldValue[0].a
          );
          expect(getByTestId("foo[0].b").value).toBe(
            type === "form" ? formValue[0].b : fieldValue[0].b
          );
        });

        act(() => {
          setError("foo", [{ a: "Required", b: "Required" }]);
          setTouched("foo[0].a", true, false);
          setTouched("foo[0].b", true, false);
          setDirty("foo[0].a");
          setDirty("foo[0].b");
          setShow(false);
        });
        await waitFor(() => expect(getState()).toEqual(initialState));

        act(() => setShow(true));
        await waitFor(() => {
          expect(getState()).toEqual(state);
          expect(getByTestId("foo[0].a").value).toBe(
            type === "form" ? formValue[0].a : fieldValue[0].a
          );
          expect(getByTestId("foo[0].b").value).toBe(
            type === "form" ? formValue[0].b : fieldValue[0].b
          );
        });
      }
    );

    it("should not remove field", async () => {
      const {
        getState,
        setError,
        setTouched,
        setDirty,
        setShow,
      } = renderHelper({
        isShow: true,
        defaultValues: { foo: formValue },
        shouldRemoveField: false,
        children: ({ show }: API) => <>{show && <FieldArray />}</>,
      });

      act(() => {
        setError("foo", [{ a: "Required", b: "Required" }]);
        setTouched("foo[0].a", true, false);
        setTouched("foo[0].b", true, false);
        setDirty("foo[0].a");
        setDirty("foo[0].b");
        setShow(false);
      });
      await waitFor(() => {
        expect(getState()).toEqual({
          ...initialState,
          values: { foo: formValue },
          errors: { foo: [{ a: "Required", b: "Required" }] },
          isValid: false,
          touched: { foo: [{ a: true, b: true }] },
          dirty: { foo: [{ a: true, b: true }] },
          isDirty: true,
        });
      });

      act(() => setShow(true));
      await waitFor(() => {
        expect(getByTestId("foo[0].a").value).toBe(formValue[0].a);
        expect(getByTestId("foo[0].b").value).toBe(formValue[0].b);
      });
    });
  });
});

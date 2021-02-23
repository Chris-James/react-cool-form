---
id: use-form-state
title: useFormState
---

This hook helps us to isolate re-rendering at the component level for performance optimization. The hook has the similar API design to the [select](../api-reference/use-form#select) method of the `useForm` that maintain a consistent DX for us. Check the [Isolating Re-rendering](../getting-started/form-state#isolating-re-rendering) to learn more.

```js
const returnValues = useFormState(path, config);
```

## Path

`string | string[] | Record<string, string>`

The path of the property we want to access from the [form state](../getting-started/form-state#about-the-form-state). We can construct the return values as follows.

- Every time an accessed value changed that will trigger re-renders. Thus, there're [some guidelines](../getting-started/form-state#best-practices) for us to use the form state.

<!-- prettier-ignore-start -->
```js
// Getting a value
const foo = useFormState("values.foo", config);

// Array pick
const [foo, bar] = useFormState(["values.foo", "values.bar"], config);

// Object pick
const { foo, bar } = useFormState({ foo: "values.foo", bar: "values.bar" }, config);
```
<!-- prettier-ignore-end -->

## Config

An `object` with the following options:

### formId

`string`

The [corresponding ID](../api-reference/use-form#id) of the `useForm` hook. We must provide it when using this hook.

### target

`string`

A default path that can help us to reduce the verbose of accessing the values from a specific target.

```js
// Current state: { values: { foo: "🍎", bar: "🥝", baz: "🍋" } }
const [foo, bar, baz] = useFormState(["foo", "bar", "baz"], {
  target: "values",
  // Other options...
});

// Current state: { values: { nest: { foo: "🍎", bar: "🥝", baz: "🍋" } } }
const [foo, bar, baz] = useFormState(["foo", "bar", "baz"], {
  target: "values.nest",
  // Other options...
});
```

### errorWithTouched

`boolean`

Enable/disable the feature of **filtering untouched errors**, which can help the user focus on typing without being annoyed by the error message. Default is `false`.

```js
// Current state: { errors: { foo: "Required" }, touched: { foo: false } }
// Returns { foo: "Required" }
const errors = useFormState("errors", {
  // Some options...
});

// Current state: { errors: { foo: "Required" }, touched: { foo: false } }
// Returns {}
const errors = useFormState("errors", {
  errorWithTouched: true,
  // Other options...
});

// Current state: { errors: { foo: "Required" }, touched: { foo: true } }
// Returns { foo: "Required" }
const errors = useFormState("errors", {
  errorWithTouched: true,
  // Other options...
});
```

## Example

The example demonstrates the basic usage of this hook.

```js
import { useFormState } from "react-cool-form";

const IsolatedComponent = () => {
  const foo = useFormState("values.foo", { formId: "form-1" });

  return <div>{foo}</div>;
};
```
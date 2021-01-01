---
id: complex-structures
title: Complex Structures
hide_table_of_contents: true
---

With React Cool Form you can use [dot](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors#Dot_notation)-and-[bracket](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors#Bracket_notation) notation as the name of a field to create arbitrarily deeply nested fields. It's very similar to Lodash's [\_.set](https://lodash.com/docs/4.17.15#set) method.

> 💡 Setting `undefined` as a field value deletes the field data from the structure (see [related doc](../api-reference/use-form#setfieldvalue)).

| Name       | Current structure                 | Value     | Result                     |
| ---------- | --------------------------------- | --------- | -------------------------- |
| foo        | { }                               | "🍎"      | { foo: "🍎" }              |
| foo.bar    | { }                               | "🍎"      | { foo: { bar: "🍎" } }     |
| foo[0]     | { }                               | "🍎"      | { foo: [ "🍎" ] }          |
| foo[1]     | { }                               | "🍎"      | { foo: [ empty, "🍎" ] }   |
| foo.0      | { }                               | "🍎"      | { foo: [ "🍎" ] }          |
| foo[0].bar | { }                               | "🍎"      | { foo: [ { bar: "🍎" } ] } |
| foo        | { foo: "🍎" }                     | undefined | { }                        |
| foo.bar    | { foo: { bar: "🍎" }, baz: "🍎" } | undefined | { baz: "🍎" }              |
| foo[0]     | { foo: [ { bar: "🍎" } ] }        | undefined | { foo: [ empty ] }         |

You can play around with the following example to get better understanding of how it works:

[![Edit RCF - Complex Structures](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/rcf-complex-structures-4x4n1?fontsize=14&hidenavigation=1&theme=dark)

```js
import { useForm } from "react-cool-form";

const FieldGroup = ({ name, onUpdate, onClear, ...rest }) => (
  <>
    <input name={name} placeholder={name} />
    <div>
      <button type="button" onClick={onUpdate}>
        Update
      </button>
      <button type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  </>
);

const App = () => {
  const { form, setFieldValue } = useForm({
    defaultValues: {
      foo: "",
      bar: [],
      baz: { nested: "" },
      qux: [{ nested: "" }],
    },
    onSubmit: (values) => console.log("onSubmit: ", values),
  });

  return (
    <form ref={form}>
      <FieldGroup
        name="foo"
        onUpdate={() => setFieldValue("foo", "🍎")}
        onClear={() => setFieldValue("foo")}
      />
      <FieldGroup
        name="bar[0]"
        onUpdate={() => setFieldValue("bar[0]", "🍋")}
        onClear={() => setFieldValue("bar[0]")}
      />
      <FieldGroup
        name="baz.nested"
        onUpdate={() => setFieldValue("baz.nested", "🍉")}
        onClear={() => setFieldValue("baz.nested")}
      />
      <FieldGroup
        name="qux[0].nested"
        onUpdate={() => setFieldValue("qux[0].nested", "🥝")}
        onClear={() => setFieldValue("qux[0].nested")}
      />
      <input type="submit" />
    </form>
  );
};
```

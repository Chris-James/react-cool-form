import React from "react";
import { render } from "react-dom";
import { useForm } from "react-cool-form";

import "./styles.scss";

const Field = ({ label, id, ...rest }) => (
  <>
    <input id={id} {...rest} />
    <label htmlFor={id}>{label}</label>
  </>
);

const Group = ({ title, children, error }) => (
  <div>
    <fieldset>
      <legend>{title}</legend>
      {children}
    </fieldset>
    {error && <p>{error}</p>}
  </div>
);

function App() {
  const { form, getState } = useForm({
    defaultValues: { single: true, multiple: [] },
    validate: (values) => {
      if (!values.multiple.length) return { multiple: "Required" };
    },
    onSubmit: (values) => alert(JSON.stringify(values, undefined, 2))
  });

  return (
    <form ref={form} noValidate>
      <Group title="Single">
        <Field label="😎" id="single" name="single" type="checkbox" />
      </Group>
      <Group title="Multitple" error={getState("errors.multiple")}>
        <Field
          label="🦸🏻‍♂️"
          id="human"
          name="multiple"
          value="🦸🏻‍♂️"
          type="checkbox"
        />
        <Field
          label="🧛🏻‍♂️"
          id="vampire"
          name="multiple"
          value="🧛🏻‍♂️"
          type="checkbox"
        />
        <Field label="🧝🏻‍♂️" id="elf" name="multiple" value="🧝🏻‍♂️" type="checkbox" />
      </Group>
      <input type="submit" />
    </form>
  );
}

render(<App />, document.getElementById("root"));

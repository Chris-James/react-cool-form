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

function App() {
  const { form } = useForm({
    defaultValues: { race: "human" },
    onSubmit: (values) => alert(JSON.stringify(values, undefined, 2)),
  });

  return (
    <form ref={form}>
      <div>
        <fieldset>
          <legend>Race</legend>
          <Field label="🦸🏻‍♂️" id="human" name="race" value="🦸🏻‍♂️" type="radio" />
          <Field label="🧛🏻‍♂️" id="vampire" name="race" value="🧛🏻‍♂️" type="radio" />
          <Field label="🧝🏻‍♂️" id="elf" name="race" value="🧝🏻‍♂️" type="radio" />
        </fieldset>
      </div>
      <input type="submit" />
    </form>
  );
}

render(<App />, document.getElementById("root"));

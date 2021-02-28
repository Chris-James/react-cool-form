import { render } from "react-dom";
import { useForm, useFormState, useFormMethods } from "react-cool-form";
import { TextField, Button } from "@material-ui/core";

import "./styles.scss";

const Field = ({ as, name, formId, onChange, onBlur, ...restProps }) => {
  const value = useFormState(`values.${name}`, { formId });
  const { setValue, setTouched } = useFormMethods(formId);
  const Component = as;

  return (
    <Component
      name={name}
      value={value}
      onChange={(e) => {
        setValue(name, e.target.value); // Update the field's value and set it as touched
        if (onChange) onChange(e);
      }}
      onBlur={(e) => {
        setTouched(name); // Set the field as touched for displaying error (if it's not touched)
        if (onBlur) onBlur(e);
      }}
      {...restProps}
    />
  );
};

function App() {
  const { form, select } = useForm({
    id: "form-1", // The ID is used by the "useFormState" and "useFormMethods" hooks
    defaultValues: { username: "" },
    // excludeFields: ["username"], // You can also exclude the field by this option
    validate: ({ username }) => {
      const errors = {};
      if (!username.length) errors.username = "Required";
      return errors;
    },
    onSubmit: (values) => alert(JSON.stringify(values, undefined, 2))
  });
  const errors = select("errors");

  return (
    <form ref={form} noValidate>
      <Field
        as={TextField}
        formId="form-1" // Provide the corresponding ID of the "useForm" hook
        label="Username"
        name="username" // Used for the "excludeFields" option
        required
        error={!!errors.username}
        helperText={errors.username}
        inputProps={{ "data-rcf-exclude": true }} // Exclude the field via the pre-defined data attribute
      />
      <Button type="submit" variant="contained" color="primary">
        Submit
      </Button>
    </form>
  );
}

render(<App />, document.getElementById("root"));

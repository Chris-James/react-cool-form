import React from "react";
import { render } from "react-dom";
import { useForm } from "react-cool-form";

import "./styles.scss";

function App() {
  const { form } = useForm({
    defaultValues: { username: "", email: "", password: "" },
    onSubmit: (values) => alert(JSON.stringify(values)),
    onError: (errors) => console.log("onError: ", errors)
  });

  return (
    <form ref={form} noValidate>
      <input name="username" placeholder="Username" />
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <input type="submit" />
    </form>
  );
}

render(<App />, document.getElementById("root"));
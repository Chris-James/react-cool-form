import { useForm, unset } from "react-cool-form";

interface FormValues {
  t1: string;
}

const defaultValues = {
  t1: "",
};

const Playground = (): JSX.Element => {
  const { form } = useForm<FormValues>();

  console.log("LOG ===> ", unset({ a: { b: [1, 2, 3] } }, "a.b.2"));

  return (
    <form ref={form} noValidate>
      <input required data-rcf-ignore />
      <input type="submit" />
    </form>
  );
};

export default Playground;

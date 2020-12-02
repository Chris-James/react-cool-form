import { Global, css } from "@emotion/react";
import normalize from "normalize.css";

import Form from "../Form";
import { root } from "./styles";

export default (): JSX.Element => (
  <>
    <Global
      styles={css`
        ${normalize}
        ${root}
      `}
    />
    <Form />
  </>
);

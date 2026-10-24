/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./theme.scss";
import "./app.scss";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";             // ← note the import from 'react-dom/client'
import App from "./App";
import { AuthProvider } from "./context/AuthContext"; // or default import, depending on your setup
import "./index.css";

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

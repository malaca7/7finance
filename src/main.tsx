import React, { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Carregando...</div>}>
      <App />
    </Suspense>
  </StrictMode>
);

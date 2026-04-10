import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import App from "./App.tsx";
import i18n from "./i18n";
import "./index.css";

// Force service worker update on page load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.update());
  });
}

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}
    >
      <App />
    </Suspense>
  </I18nextProvider>
);


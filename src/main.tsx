import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import NewMessagePage from "./Message.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  window.location.pathname === "/" ? <App /> : <NewMessagePage />
  // </StrictMode>,
);

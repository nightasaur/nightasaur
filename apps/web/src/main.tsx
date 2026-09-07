import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="ripple-bg" />
    <div className="forest-layer" />
    {["✦","⛧","⌘","◈","✧","⧖","✵","☽","⬡","△"].map((r, i) => (
      <span key={i} className="rune" style={{
        left: `${5 + i * 10}%`,
        animationDelay: `${i * 2}s`,
        animationDuration: `${15 + i * 3}s`,
        fontSize: `${20 + i * 4}px`,
      }}>{r}</span>
    ))}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
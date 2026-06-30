"use client";

import { useState, useEffect } from "react";

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 200,
        height: "3px",
        width: `${pct}%`,
        background:
          "linear-gradient(90deg, #2e9fd0 0%, #5cc6ec 60%, #a8e8f8 100%)",
        transition: "width 60ms linear",
        boxShadow: "0 0 8px rgba(92,198,236,0.6)",
      }}
    />
  );
}

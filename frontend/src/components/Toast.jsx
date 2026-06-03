import { useState, useCallback, useEffect } from "react";

let _dispatch = null;
let _idCounter = 0;

export function toast(msg, type = "info") {
  _dispatch?.({ id: ++_idCounter, msg, type });
}
toast.success = (m) => toast(m, "success");
toast.error   = (m) => toast(m, "error");
toast.info    = (m) => toast(m, "info");

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4500);
  }, []);

  useEffect(() => { _dispatch = add; return () => { _dispatch = null; }; }, [add]);

  const icons = { success: "✓", error: "✕", info: "ℹ" };

  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px", maxWidth: "340px" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          background: "var(--color-bg)", border: "1px solid",
          borderColor: t.type === "success" ? "#1D9E75" : t.type === "error" ? "#E24B4A" : "#178FDD",
          borderLeft: `3px solid ${t.type === "success" ? "#1D9E75" : t.type === "error" ? "#E24B4A" : "#178FDD"}`,
          borderRadius: "10px", padding: "12px 14px",
          boxShadow: "0 4px 16px rgba(0,0,0,.12)",
          fontSize: "13px", animation: "slideIn .2s ease",
          backgroundColor: "var(--color-surface)"
        }}>
          <span style={{ color: t.type === "success" ? "#1D9E75" : t.type === "error" ? "#E24B4A" : "#178FDD", fontWeight: 600, flexShrink: 0 }}>
            {icons[t.type]}
          </span>
          <span>{t.msg}</span>
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
const API = import.meta.env.VITE_API_URL || "http://localhost:8080";
function WordForm({ initial, onSubmit, onCancel }) {
  const [sourceLang, setSourceLang] = useState(initial?.sourceLang || "es");
  const [sourceText, setSourceText] = useState(initial?.sourceText || "");
  const [targetText, setTargetText] = useState(initial?.targetText || "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ sourceLang, sourceText, targetText });
      }}
      style={{ display: "grid", gap: 8 }}
    >
      <label>
        Idioma origen:&nbsp;
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
        >
          <option value="es">Español</option>
          <option value="en">Inglés</option>
        </select>
      </label>
      <label>
        Texto origen:&nbsp;
        <input
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          required
        />
      </label>
      <label>
        Traducción:&nbsp;
        <input
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          required
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit">Guardar</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
function App() {
  const [words, setWords] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [text, setText] = useState("");
  const [direction, setDirection] = useState("auto");
  async function load() {
    const r = await fetch(
      `${API}/api/words${q ? `?q=${encodeURIComponent(q)}` : ""}`
    );
    setWords(await r.json());
  }
  useEffect(() => {
    load();
  }, [q]);
  async function createWord(p) {
    await fetch(`${API}/api/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    load();
  }
  async function updateWord(id, p) {
    await fetch(`${API}/api/words/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    load();
  }
  async function deleteWord(id) {
    if (!confirm("¿Eliminar?")) return;
    await fetch(`${API}/api/words/${id}`, { method: "DELETE" });
    load();
  }
  async function doTranslate() {
    const r = await fetch(`${API}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, direction }),
    });
    const d = await r.json();
    alert(d.found ? `Traducción: ${d.translation}` : "No se encontró.");
  }
  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "16px" }}>
      <h1>Traductor (ES ⟷ EN) con CRUD</h1>
      <section
        style={{
          display: "grid",
          gap: 8,
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <h2>Traducir</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1 }}
            placeholder="Texto a traducir..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="auto">Auto</option>
            <option value="es-en">Español → Inglés</option>
            <option value="en-es">Inglés → Español</option>
          </select>
          <button onClick={doTranslate}>Traducir</button>
        </div>
      </section>
      <section
        style={{
          display: "grid",
          gap: 8,
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <h2>Diccionario (CRUD)</h2>
        {editing ? (
          <WordForm
            initial={editing}
            onSubmit={(p) => {
              updateWord(editing.id, p);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <WordForm onSubmit={createWord} />
        )}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <input
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={() => setQ("")}>Limpiar</button>
        </div>
        <table
          border="1"
          cellPadding="6"
          style={{ borderCollapse: "collapse", marginTop: 8 }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Origen</th>
              <th>Texto</th>
              <th>Traducción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id}>
                <td>{w.id}</td>
                <td>{w.sourceLang}</td>
                <td>{w.sourceText}</td>
                <td>{w.targetText}</td>
                <td>
                  <button onClick={() => setEditing(w)}>Editar</button>
                  <button onClick={() => deleteWord(w.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);

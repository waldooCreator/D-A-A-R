// --- Configuración base API ---
const DEFAULT_BASE = "https://todoapitest.juansegaliz.com/todos";
const qs = new URLSearchParams(location.search);
const BASE_URL = (qs.get("base") || DEFAULT_BASE).replace(/\/$/, "");

// --- Helpers generales ---
function unwrapData(obj) {
  let data = obj;
  const unwrapKeys = ["data", "result", "value", "item", "todo", "request"];
  let guard = 0;
  while (data && typeof data === "object" && !Array.isArray(data) && guard++ < 5) {
    const keys = Object.keys(data);
    const hit = unwrapKeys.find(k => k in data && typeof data[k] === "object");
    if (!hit) break;
    data = data[hit];
  }
  return data;
}

function normalizeItem(raw) {
  const item = unwrapData(raw) || raw || {};
  return {
    Id: item.Id ?? item.id ?? item.todoId ?? null,
    Title: item.Title ?? item.title ?? item.Name ?? "",
    Description: item.Description ?? item.description ?? item.Details ?? "",
    Priority: Number(item.Priority ?? item.priority ?? 2),
    IsCompleted:
      item.IsCompleted ?? item.isCompleted ?? item.completed ?? item.IsDone ?? false,
  };
}

async function api({ method = "GET", path = "", body }) {
  const url = path ? `${BASE_URL}/${String(path).replace(/^\/+/, "")}` : BASE_URL;
  const init = {
    method,
    headers: { "Accept": "application/json" },
    cache: "no-store",
  };
  if (body != null) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const resp = await fetch(url, init);
  const ct = resp.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await resp.json().catch(() => ({}))
    : await resp.text();
  return { resp, data };
}

// --- UI Elements ---
const tbody = document.getElementById("todosBody");
const form = document.getElementById("todoForm");

// --- Renderizado de tabla ---
function renderTodos(list) {
  tbody.innerHTML = "";
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">No hay tareas disponibles.</td></tr>`;
    return;
  }

  list.forEach((t, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${t.Title}</td>
        <td>${t.Description}</td>
        <td>P${t.Priority}</td>
        <td>${t.IsCompleted ? "✅" : "❌"}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="toggleTodo('${t.Id}', ${t.IsCompleted})">✔</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTodo('${t.Id}')">🗑</button>
        </td>
      </tr>
    `;
  });
}

// --- CRUD principal ---
async function loadTodos() {
  const { data } = await api({ method: "GET" });
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];
  const list = arr.map(normalizeItem);
  renderTodos(list);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const todo = {
    Title: document.getElementById("title").value,
    Description: document.getElementById("description").value,
    Priority: Number(document.getElementById("priority").value),
    IsCompleted: false,
  };

  await api({ method: "POST", body: todo });
  form.reset();
  await loadTodos();
});

async function toggleTodo(id, done) {
  const { data } = await api({ method: "GET", path: id });
  const current = normalizeItem(Array.isArray(data) ? data[0] : data);
  const updated = { ...current, IsCompleted: !done };
  await api({ method: "PUT", path: id, body: updated });
  await loadTodos();
}

async function deleteTodo(id) {
  if (!confirm("¿Eliminar esta tarea?")) return;
  await api({ method: "DELETE", path: id });
  await loadTodos();
}

// --- Inicialización ---
loadTodos().catch(console.error);

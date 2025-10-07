// === Configuración (con fallback seguro) ===
let API_BASE_URL = "__API_BASE_URL__";
if (API_BASE_URL === "__API_BASE_URL__" || !API_BASE_URL) {
  API_BASE_URL = "https://todoapitest.juansegaliz.com/todos";
}

// === Helpers ===
const $ = (sel, ctx=document) => ctx.querySelector(sel);

const qs = (name, url) => {
  const params = new URLSearchParams(url || window.location.search);
  return params.get(name);
};

const joinUrl = (base, path = "") => {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return p ? `${b}/${p}` : `${b}/`;
};

const setTheme = (t) => {
  document.documentElement.setAttribute("data-bs-theme", t);
  localStorage.setItem("theme", t);
};
const toggleTheme = () =>
  setTheme((localStorage.getItem("theme") || "light") === "light" ? "dark" : "light");

const showAlert = (where, msg, type = "warning") => {
  const el = $(where);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.classList.remove("d-none");
  el.textContent = msg;
};
const hideAlert = (where) => {
  const el = $(where);
  if (!el) return;
  el.classList.add("d-none");
};

// === Cliente API (GET/POST/PATCH/DELETE) ===
const apiGet = async (path = "") => {
  const url = joinUrl(API_BASE_URL, path);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text().catch(()=> "") || res.statusText}`);
  return res.json();
};

const apiSend = async (method, path, body) => {
  const url = joinUrl(API_BASE_URL, path);
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
  // algunas APIs devuelven 204 No Content
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
};

const apiPost = (body) => apiSend("POST", "", body);           // POST /todos/
const apiPatch = (id, body) => apiSend("PATCH", String(id), body); // PATCH /todos/{id}
const apiPut = (id, body) => apiSend("PUT", String(id), body);     // alternativa
const apiDelete = (id) => apiSend("DELETE", String(id));           // DELETE /todos/{id}

// === Mapeo tolerante (ajusta aquí si tu API usa otros nombres) ===
const mapTodo = (t = {}) => {
  const id =
    t.id ?? t._id ?? t.todoId ?? t.uuid ?? t.Id ?? t.ID ?? t.pk ?? "";
  const name =
    t.title ?? t.name ?? t.todo ?? t.task ?? (id ? `Todo ${id}` : "Todo");
  const completed =
    typeof t.completed === "boolean"
      ? t.completed
      : typeof t.isCompleted === "boolean"
      ? t.isCompleted
      : typeof t.done === "boolean"
      ? t.done
      : (String(t.status || "").toLowerCase() === "done" ||
         String(t.status || "").toLowerCase() === "completed");

  const description =
    t.description ??
    t.details ??
    t.todo ??
    (typeof completed === "boolean"
      ? `Estado: ${completed ? "Completado" : "Pendiente"}`
      : "Sin descripción.");

  const category =
    typeof completed === "boolean"
      ? completed ? "Hecho" : "Pendiente"
      : t.status ?? "Todo";

  return { id, name, description, category, completed };
};

// === Render ===
const renderCard = (item) => {
  const col = document.createElement("div");
  col.className = "col-12 col-sm-6 col-md-4 col-lg-3";
  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <div class="card-body d-flex flex-column">
        <h2 class="h6 card-title mb-2 text-truncate" title="${item.name}">${item.name}</h2>
        <p class="card-text small text-secondary flex-grow-1">${item.description ?? "Sin descripción."}</p>
        <div class="d-flex align-items-center justify-content-between mt-2">
          <span class="badge ${item.completed ? "text-bg-success" : "text-bg-primary"}">
            ${item.category ?? "Todo"}
          </span>
          <div class="btn-group">
            <a class="btn btn-sm btn-outline-primary" href="./?id=${encodeURIComponent(item.id)}">Ver</a>
            <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${item.id}">Editar</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${item.id}">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  // wire botones editar/eliminar en tarjeta
  const editBtn = col.querySelector('[data-action="edit"]');
  const delBtn = col.querySelector('[data-action="delete"]');
  editBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openEditModal(item);
  });
  delBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openDeleteModal(item.id);
  });
  return col;
};

const applyFilter = () => {
  const grid = $("#grid");
  const term = ($("#searchInput")?.value || "").toLowerCase().trim();
  const items = (window.__items || []).filter(
    (it) =>
      !term ||
      String(it.name ?? "").toLowerCase().includes(term) ||
      String(it.description ?? "").toLowerCase().includes(term)
  );
  grid.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "col-12";
    empty.innerHTML = `<div class="border rounded-3 p-4 text-center bg-body">Sin resultados.</div>`;
    grid.appendChild(empty);
    return;
  }
  items.forEach((it) => grid.appendChild(renderCard(it)));
};

// === Carga de datos ===
const loadList = async () => {
  const grid = $("#grid");
  try {
    hideAlert("#alert-list");
    grid.innerHTML = "";
    const data = await apiGet(""); // GET /todos/
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data.todos)
      ? data.todos
      : Array.isArray(data.data)
      ? data.data
      : data.items || [];
    window.__items = arr.map(mapTodo);
    applyFilter();
  } catch (err) {
    console.error(err);
    showAlert("#alert-list", err.message || "No se pudo cargar el listado");
  }
};

const loadDetail = async (id) => {
  const container = $("#content");
  try {
    hideAlert("#alert-detail");
    const data = await apiGet(String(id)); // GET /todos/{id}
    const t = mapTodo(data);
    container.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body">
          <h2 class="h5 mb-2">${t.name}</h2>
          <p class="text-secondary mb-3">${t.description}</p>
          <dl class="row">
            <dt class="col-sm-3">ID</dt>
            <dd class="col-sm-9">${t.id}</dd>
            <dt class="col-sm-3">Categoría</dt>
            <dd class="col-sm-9">${t.category}</dd>
          </dl>
        </div>
      </div>
    `;
    // preparar acciones detalle
    $("#btnEdit")?.addEventListener("click", () => openEditModal(t));
    $("#btnDelete")?.addEventListener("click", () => openDeleteModal(t.id));
  } catch (err) {
    console.error(err);
    showAlert("#alert-detail", err.message || "No se pudo cargar el detalle");
  }
};

// === Modal Crear/Editar ===
let editModal, deleteModal;
const openEditModal = (todo) => {
  $("#alert-form")?.classList.add("d-none");
  $("#todoId").value = todo?.id ?? "";
  $("#todoTitle").value = todo?.name ?? "";
  $("#todoDesc").value = todo?.description ?? "";
  $("#todoCompleted").checked = !!todo?.completed;

  $("#editModalTitle").textContent = todo?.id ? "Editar" : "Nuevo";
  if (!editModal) editModal = new bootstrap.Modal("#editModal");
  editModal.show();
};

const openDeleteModal = (id) => {
  $("#alert-delete")?.classList.add("d-none");
  $("#btnConfirmDelete").dataset.id = id;
  if (!deleteModal) deleteModal = new bootstrap.Modal("#deleteModal");
  deleteModal.show();
};

// Guardar (crear/actualizar)
const onSave = async () => {
  const id = $("#todoId").value.trim();
  const title = $("#todoTitle").value.trim();
  const description = $("#todoDesc").value.trim();
  const completed = $("#todoCompleted").checked;

  if (!title) {
    showAlert("#alert-form", "El título es obligatorio");
    return;
  }

  // Ajusta aquí los nombres exactos que tu API espera:
  const payload = {
    title,               // <- cambia a 'name' o 'task' si tu API lo requiere
    description,         // <- cambia si tu API usa 'details'
    completed            // <- o 'isCompleted'
  };

  try {
    hideAlert("#alert-form");
    if (id) {
      // PATCH /todos/{id}
      await apiPatch(id, payload);
    } else {
      // POST /todos/
      await apiPost(payload);
    }
    editModal?.hide();
    // Si estamos en detalle y editamos este item, mantenemos la vista:
    const currentId = qs("id");
    if (currentId) {
      await loadDetail(currentId);
    }
    await loadList();
  } catch (err) {
    console.error(err);
    showAlert("#alert-form", err.message || "No se pudo guardar");
  }
};

// Confirmar eliminación
const onConfirmDelete = async () => {
  const id = $("#btnConfirmDelete").dataset.id;
  if (!id) return;
  try {
    hideAlert("#alert-delete");
    await apiDelete(id);
    deleteModal?.hide();
    const currentId = qs("id");
    if (currentId && currentId === id) {
      // si se borró el que estamos viendo, volver al listado
      window.location.href = "./";
      return;
    }
    await loadList();
  } catch (err) {
    console.error(err);
    showAlert("#alert-delete", err.message || "No se pudo eliminar");
  }
};

// === Router simple (?id=) ===
const route = async () => {
  const id = qs("id");
  const list = $("#view-list");
  const detail = $("#view-detail");
  if (id) {
    list.classList.add("d-none");
    detail.classList.remove("d-none");
    await loadDetail(id);
  } else {
    detail.classList.add("d-none");
    list.classList.remove("d-none");
    await loadList();
  }
};

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  setTheme(localStorage.getItem("theme") || "light");
  $("#themeToggle")?.addEventListener("click", toggleTheme);
  $("#year").textContent = new Date().getFullYear();

  $("#searchInput")?.addEventListener("input", applyFilter);
  $("#btnNew")?.addEventListener("click", () => openEditModal(null));
  $("#btnSave")?.addEventListener("click", onSave);
  $("#btnConfirmDelete")?.addEventListener("click", onConfirmDelete);

  route();
});

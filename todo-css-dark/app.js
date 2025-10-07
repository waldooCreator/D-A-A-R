/* CSS-only UI client for https://todoapitest.juansegaliz.com/todos */

const DEFAULT_BASE = 'https://todoapitest.juansegaliz.com/todos';
const qs = new URLSearchParams(location.search);
const BASE_URL = (qs.get('base') || DEFAULT_BASE).replace(/\/$/, '');
document.getElementById('apiBaseCode').textContent = BASE_URL;

const $ = (sel, ctx=document) => ctx.querySelector(sel);

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
    Id: item.Id ?? item.id ?? item.ID ?? item.todoId ?? null,
    Title: item.Title ?? item.title ?? item.Name ?? item.name ?? "",
    Description: item.Description ?? item.description ?? item.Details ?? item.details ?? "",
    Priority: Number(item.Priority ?? item.priority ?? 0) || 0,
    IsCompleted: (typeof item.IsCompleted === "boolean") ? item.IsCompleted
               : (typeof item.isCompleted === "boolean") ? item.isCompleted
               : (typeof item.completed === "boolean") ? item.completed
               : (typeof item.IsDone === "boolean") ? item.IsDone
               : false
  };
}

function setStatus(ok) {
  const el = $("#statusPill");
  el.className = "status";
  if (ok === true) { el.textContent = "status: OK"; el.style.color = "#6ee7b7"; }
  else if (ok === false) { el.textContent = "status: ERROR"; el.style.color = "#f87171"; }
  else { el.textContent = "status: –"; el.style.color = "#e5e7eb"; }
}

function setDebug({ status, data, curl, durationMs, ok }) {
  setStatus(ok);
  $("#timing").textContent = durationMs != null ? `tiempo: ${durationMs} ms` : "";
  try { $("#output").textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2); }
  catch { $("#output").textContent = String(data); }
  $("#curl").textContent = curl;
}

function buildCurl({ method="GET", url, body }) {
  const parts = [`curl -i -X ${method} '${url}'`];
  if (body != null) {
    parts.splice(1, 0, "-H 'Content-Type: application/json'");
    parts.push(`--data '${JSON.stringify(body)}'`);
  }
  return parts.join(" \\\n  ");
}

async function api({ method="GET", path="", body }) {
  const url = path ? `${BASE_URL}/${String(path).replace(/^\/+/, "")}` : BASE_URL;
  const init = {
    method,
    headers: { "Accept": "application/json" },
    cache: "no-store"
  };
  let parsedBody;
  if (body != null) {
    parsedBody = (typeof body === "string") ? JSON.parse(body) : body;
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(parsedBody);
  }
  const started = performance.now();
  let resp, data;
  try { resp = await fetch(url, init); }
  catch (e) {
    setDebug({ status: "Network error", data: String(e), curl: buildCurl({method,url,body:parsedBody}), durationMs: Math.round(performance.now()-started), ok:false });
    throw e;
  }
  const durationMs = Math.round(performance.now() - started);
  const ct = resp.headers.get("content-type") || "";
  data = ct.includes("application/json") ? await resp.json().catch(()=> ({})) : await resp.text();
  setDebug({ status: resp.status, data, curl: buildCurl({method,url,body:parsedBody}), durationMs, ok: resp.ok });
  return { resp, data };
}

async function fetchTodoById(id) {
  const { data } = await api({ method: "GET", path: id });
  return normalizeItem(Array.isArray(data) ? data[0] : data);
}

const state = { list: [], filter: "all", q: "" };

function prioBadge(p) {
  const cls = p === 1 ? "badge" : (p===2 ? "badge badge-amber" : "badge badge-muted");
  return `<span class="${cls}">P${p||0}</span>`;
}

function doneDot(isDone) {
  return isDone
    ? '<span class="state"><span class="dot dot-done"></span>Completada</span>'
    : '<span class="state"><span class="dot"></span>Pendiente</span>';
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function renderList() {
  const ul = $("#todoList");
  const empty = $("#emptyState");
  const q = state.q.toLowerCase();
  let items = state.list;

  if (state.filter === "open") items = items.filter(i => !i.IsCompleted);
  if (state.filter === "done") items = items.filter(i => i.IsCompleted);
  if (q) items = items.filter(i => (i.Title+i.Description).toLowerCase().includes(q));

  ul.innerHTML = items.map(i => `
    <li>
      <div class="row between">
        <div style="min-width:0">
          <h3 style="margin:0 0 2px 0;color:#a7f3d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(i.Title)}</h3>
          <p class="muted small" style="margin:0">${escapeHtml(i.Description)}</p>
        </div>
        <div class="row gap-8" style="margin-left:12px">${prioBadge(i.Priority)}</div>
      </div>
      <div class="row between small" style="margin-top:8px;color:#9ca3af">
        <span>${doneDot(i.IsCompleted)}</span>
        <div class="row gap-8">
          <button class="btn btn-ghost" data-act="toggle" data-id="${i.Id}">${i.IsCompleted ? "Marcar pendiente" : "Marcar hecha"}</button>
          <button class="btn btn-primary" data-act="edit" data-id="${i.Id}">Editar</button>
          <button class="btn" style="background:#b91c1c;border-color:#7f1d1d" data-act="del" data-id="${i.Id}">Eliminar</button>
        </div>
      </div>
    </li>
  `).join("");

  empty.classList.toggle("hidden", items.length > 0);
}

async function loadTodos() {
  const { data } = await api({ method: "GET" });
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  state.list = arr.map(normalizeItem);
  renderList();
}

async function saveTodo(evt) {
  evt.preventDefault();
  const id = $("#todoId").value.trim();
  const payload = {
    Title: $("#titleInput").value.trim(),
    Description: $("#descInput").value.trim(),
    Priority: Number($("#prioInput").value) || 0,
    IsCompleted: $("#doneInput").value === "true"
  };
  if (!payload.Title || !payload.Description) { alert("Título y descripción son obligatorios."); return; }
  if (!(payload.Priority >=1 && payload.Priority <=3)) { alert("Prioridad debe estar entre 1 y 3."); return; }

  if (id) await api({ method: "PUT", path: id, body: { Id: Number(id), ...payload } });
  else await api({ method: "POST", body: payload });

  resetForm();
  await loadTodos();
}

function resetForm() {
  $("#todoId").value = "";
  $("#titleInput").value = "";
  $("#descInput").value = "";
  $("#prioInput").value = "2";
  $("#doneInput").value = "false";
  $("#formTitle").textContent = "Nueva tarea";
  $("#btnCancelEdit").classList.add("hidden");
}

async function editTodo(id) {
  const item = await fetchTodoById(id);
  $("#todoId").value = id;
  $("#titleInput").value = item.Title || "";
  $("#descInput").value = item.Description || "";
  $("#prioInput").value = String(item.Priority || 2);
  $("#doneInput").value = String(!!item.IsCompleted);
  $("#formTitle").textContent = "Editar tarea #" + id;
  $("#btnCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function toggleTodo(id) {
  const cur = await fetchTodoById(id);
  const payload = {
    Title: cur.Title,
    Description: cur.Description,
    Priority: Number(cur.Priority) || 2,
    IsCompleted: !cur.IsCompleted
  };
  await api({ method: "PUT", path: id, body: { Id: Number(id), ...payload } });
  await loadTodos();
}

async function deleteTodo(id) {
  if (!confirm("¿Eliminar la tarea #" + id + "?")) return;
  await api({ method: "DELETE", path: id });
  await loadTodos();
}

$("#todoForm").addEventListener("submit", saveTodo);
$("#btnCancelEdit").addEventListener("click", resetForm);
$("#btnReset").addEventListener("click", resetForm);
$("#btnReload").addEventListener("click", loadTodos);
$("#filterSelect").addEventListener("change", (e)=>{ state.filter = e.target.value; renderList(); });
$("#searchInput").addEventListener("input", (e)=>{ state.q = e.target.value; renderList(); });

$("#todoList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  const act = btn.getAttribute("data-act");
  if (act === "edit") editTodo(id);
  else if (act === "del") deleteTodo(id);
  else if (act === "toggle") toggleTodo(id);
});

loadTodos().catch(console.error);

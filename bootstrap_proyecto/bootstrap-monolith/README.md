# Proyecto Bootstrap Monolito (1 HTML, 1 JS)

Estructura mínima con **Bootstrap 5**, sin CSS personalizado. Usa **una sola página HTML** y **un solo archivo JS**.
Se mantiene el consumo de la misma API (`items` y `items/{id}`), ajusta el base URL con `.env` o editando `js/app.js`.

## Estructura
```
bootstrap-monolith/
├─ index.html
├─ js/
│  └─ app.js
├─ assets/
│  └─ logo.svg
├─ Dockerfile
├─ nginx.conf
├─ docker-compose.yml
└─ .env.example
```

## Ejecutar sin Docker
Sirve el directorio con cualquier servidor estático (por ejemplo, Python):
```bash
python3 -m http.server 5173
```
Abre http://localhost:5173

## Ejecutar con Docker
```bash
cp .env.example .env  # opcional, edita API_BASE_URL
docker build -t bootstrap-monolith .
docker run -p 8080:80 --env API_BASE_URL="https://api.ejemplo.com" bootstrap-monolith
# Abre http://localhost:8080
```
Con docker-compose:
```bash
docker compose up --build
```

## Notas
- **Monolito**: `index.html` contiene las vistas de *Listado* y *Detalle* (conmutadas por el parámetro `?id=`).
- **API**:
  - Listado: `GET ${API_BASE_URL}/items`
  - Detalle: `GET ${API_BASE_URL}/items/{id}`
- **Config**: `API_BASE_URL` se reemplaza dentro de `js/app.js` en el arranque del contenedor usando `sed`.

# ToDo CSS Dark (black & emerald)

Misma app del front en tema **oscuro + verde**, ahora con **CSS puro** (sin Tailwind). Consume la API:
`https://todoapitest.juansegaliz.com/todos`

- CRUD completo (listar, crear, editar, eliminar, toggle).
- Depuración integrada (respuesta + cURL).
- Dockerizado con **Nginx**.
- Corre en **8085** para coexistir con el de Tailwind.

## Estructura
```
.
├─ index.html
├─ styles.css
├─ app.js
├─ nginx.conf
├─ Dockerfile
├─ docker-compose.build.yml
└─ docker-compose.run.yml
```

## Ejecutar local (sin Docker)
Abre `index.html` (ideal con un servidor estático).

## Build + Run con Docker
```bash
docker build -t todo-css-dark:latest .
docker run -d --name todo-css-dark -p 8085:80 todo-css-dark:latest
# http://localhost:8085
```

### docker-compose (modo build)
```bash
docker compose -f docker-compose.build.yml up -d --build
# http://localhost:8085
```

## Publicar en Docker Hub
```bash
docker tag todo-css-dark:latest waldoocreator/todo-css-dark:latest
docker push waldoocreator/todo-css-dark:latest
```

## Ejecutar desde Docker Hub
```bash
docker run -d --name todo-css-dark -p 8085:80 waldoocreator/todo-css-dark:latest
# http://localhost:8085
```

# ToDo Tailwind Dark (black & emerald)

Frontend minimalista en **Tailwind** (tema negro con acentos verde) que consume la API:
`https://todoapitest.juansegaliz.com/todos`

- Lista, crea, actualiza, elimina y marca tareas como completadas.
- Interfaz simple: lista a la izquierda, formulario a la derecha.
- Depuración integrada (respuesta y cURL).
- Dockerizado con **Nginx**.

> Puedes cambiar la API usando el query param `?base=URL`, donde `URL` debe apuntar al endpoint **/todos**.
> Ejemplo: `http://localhost:8083/?base=https://todoapitest.juansegaliz.com/todos`

## Estructura
```
.
├─ index.html
├─ app.js
├─ nginx.conf
├─ Dockerfile
├─ docker-compose.build.yml
└─ docker-compose.run.yml
```

## Ejecutar local (sin Docker)
Abre `index.html` en tu navegador. (Recomendado usar un server estático como Live Server, aunque no es obligatorio).

## Build + Run con Docker
```bash
# 1) Construir imagen
docker build -t todo-tailwind-dark:latest .

# 2) Correr contenedor
docker run -d --name todo-tailwind -p 8083:80 todo-tailwind-dark:latest
# Frontend: http://localhost:8083
```

### Usando docker-compose (modo build)
```bash
docker compose -f docker-compose.build.yml up -d --build
# Frontend: http://localhost:8083
```

## Publicar en Docker Hub
Asegúrate de estar logueado: `docker login`

```bash
# Etiqueta la imagen local con tu usuario de Docker Hub
docker tag todo-tailwind-dark:latest YOUR_DOCKERHUB_USERNAME/todo-tailwind-dark:latest

# Sube la imagen
docker push YOUR_DOCKERHUB_USERNAME/todo-tailwind-dark:latest
```

## Ejecutar desde la imagen de Docker Hub
Edita `docker-compose.run.yml` y reemplaza `YOUR_DOCKERHUB_USERNAME` por tu usuario.

```bash
docker compose -f docker-compose.run.yml up -d
# Frontend: http://localhost:8083
```

## Notas
- El front llama directamente a la API por HTTPS; no requiere proxy inverso.
- Se deshabilita caché estática en Nginx para evitar problemas al actualizar.
- Después de crear/editar/eliminar, la lista se recarga automáticamente.

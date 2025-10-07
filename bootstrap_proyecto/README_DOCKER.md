# Dockerización – Bootstrap Monolito

## Comandos
docker build -t bootstrap-monolith .
docker run --rm -p 8080:80 --env API_BASE_URL="https://todoapitest.juansegaliz.com/todos" bootstrap-monolith

## Compose
docker compose up --build
docker compose down

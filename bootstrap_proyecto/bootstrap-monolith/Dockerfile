# Nginx para contenido estático
FROM nginx:1.27-alpine

# Variable de entorno opcional para la API
ENV API_BASE_URL="https://api.ejemplo.com"

# Dependencias mínimas
RUN apk add --no-cache bash coreutils sed

# Copiar proyecto
COPY . /usr/share/nginx/html

# En cada arranque, sustituir el marcador __API_BASE_URL__ dentro de js/app.js
# por el valor de la variable de entorno API_BASE_URL
RUN printf '#!/bin/sh\nsed -i \"s#__API_BASE_URL__#${API_BASE_URL}#g\" /usr/share/nginx/html/js/app.js\n' > /docker-entrypoint.d/99-set-api.sh && \
    chmod +x /docker-entrypoint.d/99-set-api.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Nginx to serve static SPA
FROM nginx:1.27-alpine
ENV API_BASE_URL="https://todoapitest.juansegaliz.com/todos"
RUN apk add --no-cache bash coreutils sed
COPY . /usr/share/nginx/html
RUN printf '#!/bin/sh\nset -e\nif [ -f /usr/share/nginx/html/js/app.js ]; then\n  sed -i "s#__API_BASE_URL__#${API_BASE_URL}#g" /usr/share/nginx/html/js/app.js || true\nfi\n' > /docker-entrypoint.d/99-set-api.sh && \
    chmod +x /docker-entrypoint.d/99-set-api.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Imagen base oficial (de nginx, no de ningún usuario)
FROM nginx:alpine

# Configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

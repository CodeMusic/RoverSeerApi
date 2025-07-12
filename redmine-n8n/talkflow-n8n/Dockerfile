
# Build stage
FROM node:22.13.1 as builder

ARG VITE_BASE_PATH
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:latest

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create env-config.js template with proper escaping
RUN echo "window.env = {" > /usr/share/nginx/html/env-config.template.js && \
    echo "  VITE_N8N_WEBHOOK_URL: '\${VITE_N8N_WEBHOOK_URL}'," >> /usr/share/nginx/html/env-config.template.js && \
    echo "  VITE_WELCOME_MESSAGE: \"\${VITE_WELCOME_MESSAGE}\"," >> /usr/share/nginx/html/env-config.template.js && \
    echo "  VITE_SITE_TITLE: \"\${VITE_SITE_TITLE}\"," >> /usr/share/nginx/html/env-config.template.js && \
    echo "  VITE_N8N_WEBHOOK_USERNAME: \"\${VITE_N8N_WEBHOOK_USERNAME}\"," >> /usr/share/nginx/html/env-config.template.js && \
    echo "  VITE_N8N_WEBHOOK_SECRET: \"\${VITE_N8N_WEBHOOK_SECRET}\"," >> /usr/share/nginx/html/env-config.template.js && \
    echo "  VITE_ASSISTANT_NAME: \"\${VITE_ASSISTANT_NAME}\"" >> /usr/share/nginx/html/env-config.template.js && \
    echo "};" >> /usr/share/nginx/html/env-config.template.js

# Create entrypoint script
RUN echo '#!/bin/sh\n\
    envsubst < /usr/share/nginx/html/env-config.template.js > /usr/share/nginx/html/env-config.js\n\
    nginx -g "daemon off;"' > /docker-entrypoint.sh \
    && chmod +x /docker-entrypoint.sh

# Install envsubst
RUN apt-get update && apt-get install -y gettext-base && rm -rf /var/lib/apt/lists/*

# Expose port 80
EXPOSE 80

# Start nginx with our custom entrypoint script
CMD ["/docker-entrypoint.sh"]

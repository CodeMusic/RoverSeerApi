FROM n8nio/n8n:latest

# Copy custom Redmine node into the container's custom directory
COPY ./custom-nodes /home/node/.n8n/custom

# Optional: set correct permissions
USER root
RUN chown -R node:node /home/node/.n8n/custom
USER node

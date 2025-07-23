# 🚀 ClaraVerse Integration Summary
## Tailored for your musai.codemusic.ca setup

### 🎯 **Your Specific Configuration**

- **Domain**: `musai.codemusic.ca` (replacing clara.codemusic.ca)
- **Ollama**: Running on local metal (not containerized)
- **N8N**: Already running at `n8n.codemusic.ca`
- **Apache Proxy**: MacMini → iMac Docker containers

### 🏗️ **Architecture Overview**

```
Internet → Apache (MacMini) → iMac Docker Containers
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Apache Reverse Proxy (MacMini)                         │
│ https://musai.codemusic.ca                             │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│ iMac Docker Environment                                 │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│ │ ClaraVerse  │  │ ComfyUI     │  │ Your Existing   │  │
│ │ :8000       │  │ :3333       │  │ Services        │  │
│ └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│ Local Machine (iMac)                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Ollama :11434 (Local Metal)                        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 🔧 **Port Mappings**

| Service | Internal Docker | Apache Proxy | External Access |
|---------|----------------|--------------|-----------------|
| ClaraVerse | :8069 | :8000 | https://musai.codemusic.ca/ |
| ComfyUI | :8188 | :3333 | https://musai.codemusic.ca/api/comfy/ |
| ComfyUI UI | :8188 | :3333 | https://musai.codemusic.ca/comfyui/ |
| Ollama | host:11434 | - | Direct access from containers |
| N8N | :5678 | - | https://n8n.codemusic.ca |

### 📁 **Updated Files**

1. **`docker-compose-updated.yml`** - Your production Docker setup
2. **`development-setup.md`** - Development workflow guide
3. **`setup-clara-dev.sh`** - Automated setup script
4. **`apache-config-update.conf`** - Apache configuration

### 🚀 **Quick Setup Steps**

```bash
# 1. Update your Docker Compose
cp docker-compose-updated.yml docker-compose.yml

# 2. Run automated setup
./setup-clara-dev.sh

# 3. Update Apache configuration (on MacMini)
# Copy apache-config-update.conf to your Apache config

# 4. Start services
docker-compose up -d

# 5. Start development (optional)
cd ClaraVerse-dev && npm run dev
```

### 🌐 **Access URLs**

**Production (via Apache Proxy):**
- **ClaraVerse**: https://musai.codemusic.ca
- **ComfyUI Interface**: https://musai.codemusic.ca/comfyui/
- **ComfyUI API**: https://musai.codemusic.ca/api/comfy/
- **N8N**: https://n8n.codemusic.ca

**Development (direct access):**
- **ClaraVerse Dev**: http://localhost:5173
- **Ollama**: http://localhost:11434

### 🔗 **N8N Integration Features**

✅ **Automatic Discovery** - ClaraVerse connects to your existing n8n  
✅ **Webhook Integration** - Create workflows that trigger ClaraVerse  
✅ **Bidirectional Data Flow** - n8n ↔ ClaraVerse communication  
✅ **Shared AI Models** - Both systems access the same Ollama instance  
✅ **Workflow Import** - Import existing n8n workflows to Agent Studio  

### 🛠️ **Key Configuration Changes**

**Docker Compose Changes:**
- Removed Ollama container (using local metal)
- Mapped ClaraVerse to port 8000 (for Apache)
- Mapped ComfyUI to port 3333 (for Apache API routing)
- Added host networking for Ollama access
- Updated environment variables for your domains

**Apache Configuration:**
- Routes `/` to ClaraVerse (port 8000)
- Routes `/api/comfy/` to ComfyUI API (port 3333)
- Routes `/comfyui/` to ComfyUI interface (port 3333)
- WebSocket support for real-time features
- CORS headers for API integration

**Development Environment:**
- Connects to production Ollama (localhost:11434)
- Connects to production N8N (n8n.codemusic.ca)
- Uses proxy routing for ComfyUI access

### 🧪 **Testing Your Setup**

**1. Test Ollama Connection:**
```bash
curl http://localhost:11434/api/tags
```

**2. Test N8N Webhook:**
```bash
curl -X POST https://n8n.codemusic.ca/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"message": "test from ClaraVerse"}'
```

**3. Test ClaraVerse:**
```bash
# After starting docker-compose up -d
curl https://musai.codemusic.ca/
```

**4. Test ComfyUI:**
```bash
curl https://musai.codemusic.ca/api/comfy/queue
```

### 🎯 **Development Workflow**

**Daily Development:**
```bash
# 1. Keep production running
docker-compose up -d

# 2. Start development server
cd ClaraVerse-dev && npm run dev

# 3. Develop on localhost:5173
# 4. Test integration with production services
# 5. Deploy when ready
```

**Production Deployment:**
```bash
# 1. Test build
cd ClaraVerse-dev && npm run build

# 2. Update container
docker-compose restart claraverse

# 3. Access via https://musai.codemusic.ca
```

### 🔧 **Apache Module Requirements**

Ensure these modules are enabled on your MacMini:
```bash
# Enable required modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel  # For WebSocket support
sudo a2enmod rewrite
sudo a2enmod headers

# Restart Apache
sudo systemctl restart apache2  # or httpd
```

### 🐛 **Troubleshooting**

**Common Issues:**

1. **Ollama Connection Issues:**
   ```bash
   # Check if Ollama is running
   ps aux | grep ollama
   
   # Check if accessible from Docker
   docker exec claraverse curl http://host.docker.internal:11434/api/tags
   ```

2. **ComfyUI Not Loading:**
   ```bash
   # Check ComfyUI container
   docker logs clara_comfyui
   
   # Test direct access
   curl http://localhost:3333/queue
   ```

3. **Apache Proxy Issues:**
   ```bash
   # Check Apache error logs on MacMini
   tail -f /var/log/apache2/musai_error.log
   
   # Test backend connectivity
   curl http://im1ac.local:8000/
   ```

### 🎉 **Next Steps**

1. **Start Services**: `docker-compose up -d`
2. **Update Apache Config**: Apply the new configuration
3. **Test Integration**: Verify all services are accessible
4. **Configure ClaraVerse**: Set up n8n connection in ClaraVerse settings
5. **Create First Workflow**: Build a test workflow connecting n8n → ClaraVerse
6. **Start Development**: Begin customizing ClaraVerse for your needs

### 📚 **Additional Resources**

- **Development Guide**: `development-setup.md`
- **Apache Config**: `apache-config-update.conf`
- **Setup Script**: `setup-clara-dev.sh`
- **Docker Compose**: `docker-compose-updated.yml`

Your ClaraVerse integration is now perfectly tailored to your existing infrastructure! 🚀 
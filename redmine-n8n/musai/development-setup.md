# 🚀 ClaraVerse Development Setup Guide

## 📁 **Recommended Directory Structure**

```
your-project/
├── docker-compose.yml           # Your updated production setup
├── clara/                       # ClaraVerse configuration
│   └── config/
├── ClaraVerse-dev/             # Development clone
│   ├── src/
│   ├── package.json
│   └── ... (ClaraVerse source)
├── redmine/
├── n8n/
├── roverchat-n8n/
└── ... (your existing services)
```

## 🛠️ **Development Workflow Setup**

### **Step 1: Clone ClaraVerse for Development**

```bash
# In your project directory
git clone https://github.com/badboysm890/ClaraVerse.git ClaraVerse-dev
cd ClaraVerse-dev

# Install dependencies
npm install
```

### **Step 2: Start Your Production Stack**

```bash
# Start your existing services (including ClaraVerse container)
docker-compose up -d

# Verify services are running
docker-compose ps
```

### **Step 3: Development vs Production Setup**

You now have **two ClaraVerse instances**:

1. **Production**: `http://localhost:8069` (Docker container)
2. **Development**: `http://localhost:5173` (local dev server)

### **Step 4: Start Development Server**

```bash
cd ClaraVerse-dev

# Option A: Web development server
npm run dev
# Runs on http://localhost:5173

# Option B: Electron development (if you need desktop features)
npm run electron:dev
```

## 🔄 **Development Workflow**

### **Daily Development Process:**

1. **Keep production running** (for n8n integration testing):
   ```bash
   docker-compose up -d claraverse n8n ollama
   ```

2. **Start development server**:
   ```bash
   cd ClaraVerse-dev
   npm run dev
   ```

3. **Develop on**: `http://localhost:5173`
4. **Test integration with**: `http://localhost:8069` (production)

### **Environment Configuration**

Create a development `.env` file:

```bash
# ClaraVerse-dev/.env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:5173
VITE_N8N_URL=http://localhost:5678
VITE_N8N_WEBHOOK_URL=https://n8n.codemusic.ca/
VITE_OLLAMA_URL=http://localhost:11434  # Local Ollama on metal
VITE_COMFYUI_URL=http://localhost:3333  # ComfyUI via Apache proxy

# Development flags
VITE_DEBUG=true
VITE_HOT_RELOAD=true
```

## 🔧 **Configuration Setup**

### **Connect Dev ClaraVerse to Production Services**

Create `ClaraVerse-dev/config/development.json`:

```json
{
  "services": {
    "n8n": {
      "url": "http://localhost:5678",
      "webhookUrl": "https://n8n.codemusic.ca/",
      "enabled": true
    },
    "ollama": {
      "url": "http://localhost:11434",
      "enabled": true
    },
    "comfyui": {
      "url": "http://localhost:8188",
      "enabled": true
    }
  },
  "development": {
    "hotReload": true,
    "debugMode": true,
    "mockData": false
  }
}
```

## 🧪 **Testing Strategy**

### **Test Both Environments**

1. **Development Testing** (`localhost:5173`):
   - Fast iteration
   - Hot reload
   - Debug tools
   - Connect to production services

2. **Production Testing** (`localhost:8069`):
   - Real container environment
   - Full service integration
   - Performance testing

### **Testing N8N Integration**

```bash
# Test webhook from development ClaraVerse
curl -X POST http://localhost:5173/api/test-n8n \
  -H "Content-Type: application/json" \
  -d '{"message": "test from dev"}'

# Test webhook from production ClaraVerse
curl -X POST http://localhost:8069/api/test-n8n \
  -H "Content-Type: application/json" \
  -d '{"message": "test from prod"}'
```

## 🚀 **Deployment Process**

### **When Ready to Deploy Changes:**

1. **Test in development**:
   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

2. **Update production container**:
   ```bash
   # Option A: Rebuild custom image
   docker build -t my-claraverse:latest ./ClaraVerse-dev
   
   # Update docker-compose.yml
   # claraverse:
   #   image: my-claraverse:latest
   
   # Option B: Volume mount for quick testing
   # Add to docker-compose.yml:
   # volumes:
   #   - ./ClaraVerse-dev/dist:/app/dist
   ```

3. **Restart production**:
   ```bash
   docker-compose restart claraverse
   ```

## 🎯 **Port Map Reference**

| Service | Development | Production | Purpose |
|---------|-------------|------------|---------|
| ClaraVerse | :5173 | :8000→musai.codemusic.ca | Main app |
| N8N | - | :5678→n8n.codemusic.ca | Workflows |
| Ollama | :11434 | :11434 (local metal) | Local AI |
| ComfyUI | - | :3333→musai.codemusic.ca/api/ | Image gen |
| Redmine | - | :3000 | Project mgmt |
| RoverChat | - | :5680 | Chat UI |

## 🔄 **N8N Integration Development**

### **Create Development Webhooks**

1. **In your n8n** (http://localhost:5678):
   - Create webhook: `/webhook/clara-dev/test`
   - Create webhook: `/webhook/clara-prod/test`

2. **Test both endpoints**:
   ```bash
   # From development ClaraVerse
   curl -X POST https://n8n.codemusic.ca/webhook/clara-dev/test \
     -d '{"source": "development", "data": "test"}'
   
   # From production ClaraVerse
   curl -X POST https://n8n.codemusic.ca/webhook/clara-prod/test \
     -d '{"source": "production", "data": "test"}'
   ```

## 📝 **Development Commands**

```bash
# Development workflow
cd ClaraVerse-dev

# Start development
npm run dev                    # Web dev server
npm run electron:dev          # Desktop dev

# Building
npm run build                 # Production build
npm run preview              # Test production build

# Testing
npm test                     # Run tests
npm run test:watch          # Watch mode
npm run test:integration    # Integration tests

# Linting
npm run lint                # Check code
npm run lint:fix           # Fix issues

# Docker integration
docker-compose up claraverse   # Start production
docker-compose logs claraverse # View logs
docker-compose restart claraverse # Restart
```

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Port conflicts**:
   ```bash
   # Check what's using ports
   lsof -i :5173  # Development
   lsof -i :8069  # Production
   ```

2. **N8N connection issues**:
   ```bash
   # Test n8n connectivity
   curl http://localhost:5678/healthz
   ```

3. **Service dependencies**:
   ```bash
   # Restart in order
   docker-compose restart ollama
   docker-compose restart n8n
   docker-compose restart claraverse
   ```

4. **Development server issues**:
   ```bash
   # Clear cache and restart
   cd ClaraVerse-dev
   rm -rf node_modules/.vite
   npm run dev
   ```

## 🎯 **Quick Start Commands**

```bash
# 1. Start production services
docker-compose up -d

# 2. Start development
cd ClaraVerse-dev && npm run dev

# 3. Access development: http://localhost:5173
# 4. Access production: https://musai.codemusic.ca
# 5. Access n8n: https://n8n.codemusic.ca
```

This setup gives you the best of both worlds: fast development iteration while maintaining full integration with your production stack! 
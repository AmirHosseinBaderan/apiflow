# API Flow

Self-hosted API Testing & Workflow Platform. Build, test, and automate API requests with collections, environments, and workflows.

## What is API Flow?

API Flow is a self-hosted platform for API development and testing. It helps you organize API requests, manage environments through variables, and automate testing workflows. Think of it as a lightweight Postman/Insomnia alternative that runs entirely on your own infrastructure with no external database required.

### Key Capabilities

- **Collections**: Group related API requests into folders for better organization
- **Full Request Editor**: Configure method, URL, headers, query/path params, body, auth, timeouts, retries
- **Variables & Environments**: Define collection-level variables and extract values from responses at runtime
- **Workflows**: Chain multiple requests together with conditions, variable mappings, and per-step overrides
- **Test Assertions**: Write tests against responses with built-in assertions
- **Execution History**: Track past runs with status codes, response bodies, and test results
- **Multi-User**: Support for teams with individual accounts and admin management
- **File Uploads**: Attach files to multipart/form-data requests
- **OpenAPI Import**: Generate collections from OpenAPI/Swagger specs

---

## Tech Stack

- **Frontend**: Vue 3 + Vuetify + Pinia + Vite
- **Backend**: Express + TypeScript
- **Storage**: JSON file-based (no external database)
- **Auth**: JWT tokens

---

## Quick Start (Local Development)

### Prerequisites

- Node.js >= 18
- npm

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 2. Start backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Start frontend (another terminal)

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Setup

Open `http://localhost:5173`, complete the setup wizard to create your admin account.

---

## Docker Deployment

### Docker Compose (Recommended)

```yaml
services:
  api-flow:
    build: .
    ports:
      - "8080:80"
      - "3001:3001"
    environment:
      - PORT=3001
      - DATA_DIR=/data
      - JWT_SECRET=your-secret-key-change-in-production
    volumes:
      - ./data:/data
    restart: unless-stopped
```

```bash
docker compose up -d
```

Open `http://localhost:8080`.

### Docker only

```bash
docker build -t api-flow .
docker run -d \
  -p 8080:80 \
  -p 3001:3001 \
  -v ./data:/data \
  -e JWT_SECRET=change-me-in-production \
  --name api-flow \
  api-flow
```

---

## Nginx Configuration

### Reverse proxy (HTTP)

```nginx
server {
  listen 80;
  server_name api-flow.example.com;

  client_max_body_size 50M;

  location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    root /path/to/web/dist;
    try_files $uri $uri/ /index.html;
  }
}
```

### HTTPS with Let's Encrypt

```nginx
server {
  listen 443 ssl http2;
  server_name api-flow.example.com;

  ssl_certificate /etc/letsencrypt/live/api-flow.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api-flow.example.com/privkey.pem;

  client_max_body_size 50M;

  location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    root /path/to/web/dist;
    try_files $uri $uri/ /index.html;
  }
}

server {
  listen 80;
  server_name api-flow.example.com;
  return 301 https://$host$request_uri;
}
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `DATA_DIR` | Persistent data directory | `./data` |
| `JWT_SECRET` | JWT signing secret | `change-me-in-production` |

**Important**: Set a strong `JWT_SECRET` in production.

---

## Data & Persistence

All data lives in `DATA_DIR`:

```
data/
  config/
    settings.json
  users/
    admin.json
  collections/
    col_xxx.json
  files/
    (uploads)
```

### Backup

```bash
tar -czf api-flow-backup.tar.gz ./data
```

### Restore

```bash
tar -xzf api-flow-backup.tar.gz
```

---

## How to Use API Flow

### 1. Collections

A **Collection** is a container for your API project. It holds requests, folders, variables, and workflows.

- Click **New Collection** to create one
- Give it a name like `Academy API` or `Payment Service`
- Select a collection to open it

### 2. Folders

Inside a collection, organize requests into **Folders**:

- Create folders by feature or endpoint group: `Auth`, `Users`, `Orders`
- Drag requests between folders
- Nest folders if needed

### 3. Requests

A **Request** represents a single API call. Click **New Request** inside a collection or folder.

#### Request Editor Tabs

| Tab | Purpose |
|-----|---------|
| **Params** | Path parameters and query parameters |
| **Headers** | Custom HTTP headers |
| **Body** | Request body (none, raw, JSON, form, multipart) |
| **Auth** | Authentication configuration |
| **Pre-Request** | Scripts to run before the request |
| **Tests** | Assertions to validate the response |
| **Extract** | Extract values from response into variables |
| **Variables** | Request-scoped variables |
| **Settings** | Timeout, retry policy, redirect behavior |

#### Variables in Requests

Use `{{variableName}}` syntax anywhere in the request editor:

- URL: `https://api.example.com/users/{{userId}}`
- Headers: `Authorization: Bearer {{access_token}}`
- Body: `{"email": "{{userEmail}}"}`

Variables resolve in this priority order:
1. **Runtime** variables (extracted during workflow execution)
2. **Request** variables
3. **Collection** variables

#### Body Types

- **none**: No body (GET, DELETE)
- **json**: JSON body with syntax-aware editor
- **raw**: Plain text
- **text**: Text body
- **form**: `application/x-www-form-urlencoded` key-value pairs
- **multipart**: `multipart/form-data` with file uploads

#### Auth Types

- **none**: No authentication
- **bearer**: Bearer token
- **basic**: Basic auth (username/password)
- **api-key**: Custom header or query param API key

### 4. Collection Variables

Collection variables are shared across all requests in a collection. Define them once and reference them everywhere.

**Use cases:**
- Base URL: `{{baseUrl}}`
- API keys: `{{apiKey}}`
- User tokens: `{{access_token}}`

Go to the collection view and open the **Variables** tab to manage them.

### 5. Workflows

A **Workflow** chains multiple requests together. This is useful for:
- Login flows (send OTP -> verify OTP -> get profile)
- CRUD sequences (create -> read -> update -> delete)
- End-to-end testing

#### Creating a Workflow

1. Open a collection
2. Click **Workflows** tab
3. Click **New Workflow**
4. Add steps by selecting requests from the collection

#### Step Configuration

Each step has:

- **Request**: Which API request to execute
- **Condition**: When to run this step
  - `always`: Always run
  - `statusEquals`: Run only if previous response status matches
  - `variableEquals`: Run only if a variable matches a value
  - `expression`: Custom expression
- **Next**: What to do after this step
  - `next`: Continue to next step
  - `jump`: Jump to a specific step
  - `end`: Stop workflow
- **Variable Mappings**: Map extracted variables to request variables
- **Overrides**: Override path params, query params, headers, or body for this specific step

#### Running a Workflow

1. Open the workflow
2. Click **Run Workflow**
3. Optionally enable **Run Tests** to execute test assertions
4. View results step-by-step with status codes, response bodies, and test outcomes

### 6. Variable Extraction & Mapping

After a request runs, you can extract values from the response into variables.

**Example: Login flow**

1. **Step 1**: Send OTP
   - Response: `{"otpId": "123", "status": "sent"}`
   - Extract `otpId` from response body JSON path

2. **Step 2**: Verify OTP
   - Map `otpId` to request variable
   - Response: `{"access_token": "abc123", "refresh_token": "xyz789"}`
   - Extract `access_token` and `refresh_token`

3. **Step 3**: Get Profile
   - Header: `Authorization: Bearer {{access_token}}`

### 7. Tests

Write test assertions in the **Tests** tab of any request. Tests run when:
- You send the request manually
- You run a workflow with **Run Tests** enabled

Common assertions:
- Status code equals 200
- Response body contains a field
- Response time is under a threshold

### 8. Execution History

Every request execution is recorded. View history to:
- Debug failed requests
- Compare response changes over time
- Re-run previous requests

---

## Personal Use

1. Complete setup with single-user mode
2. Create one collection per project
3. Add all your API endpoints as requests
4. Use collection variables for base URLs and tokens
5. Create workflows for common testing sequences
6. Use extraction to chain requests (e.g., login -> use token)

### Example: Personal API Testing

```
Collection: "My SaaS API"
  Variables:
    baseUrl = https://api.mysaas.com
    token = (extracted at runtime)

  Folder: "Auth"
    - POST /auth/login
    - POST /auth/refresh

  Folder: "Users"
    - GET /users/me
    - GET /users/{{userId}}

  Workflow: "Daily Health Check"
    Step 1: GET /health (always)
    Step 2: GET /users/me (if health == 200)
```

---

## Team Use

### Enabling Multi-User

1. Go to **Settings**
2. Enable **Multi-User Mode**
3. Share the instance URL with your team

### Admin Management

Admins can:
- Create user accounts
- Delete users
- Reset passwords

Go to **Admin Panel** from the home page.

### Team Best Practices

- Use consistent variable naming: `baseUrl`, `apiKey`, `userId`
- Organize by service: one collection per microservice
- Document workflows for common test scenarios
- Use status conditions to skip optional steps
- Export/import collections to share with team members

### Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, manage users, settings |
| **User** | Create/edit requests, run workflows, view collections |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Send request |
| `Ctrl+S` / `Cmd+S` | Save request |
| `Ctrl+Shift+Enter` | Run workflow |
| `Esc` | Close dialog |

---

## Security Notes

- Always set `JWT_SECRET` in production
- Use HTTPS (terminate at Nginx or load balancer)
- Change the default `admin` password after first login
- Backup the `data` directory regularly
- Keep `backend/dist` private; source code is in `backend/src`

---

## License

Private / Proprietary

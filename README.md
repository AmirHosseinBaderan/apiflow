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

### 1. Home Page

The home page shows your workspace overview:
- **Recent Collections**: Quick access to recently opened collections
- **Create New**: Buttons to create new collections or folders
- **User Menu**: Access profile, settings, and admin panel

### 2. Collections

A **Collection** is a container for your API project. It holds requests, folders, variables, and workflows.

- Click **New Collection** to create one
- Give it a name like `Academy API` or `Payment Service`
- Select a collection to open it
- Each collection has its own set of requests, folders, variables, and workflows

### 3. Folders

Inside a collection, organize requests into **Folders**:

- Create folders by feature or endpoint group: `Auth`, `Users`, `Orders`
- Drag requests between folders
- Nest folders if needed
- Folders help keep large collections manageable

### 4. Requests

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

### 5. Collection Variables

Collection variables are shared across all requests in a collection. Define them once and reference them everywhere.

**Use cases:**
- Base URL: `{{baseUrl}}`
- API keys: `{{apiKey}}`
- User tokens: `{{access_token}}`

Go to the collection view and open the **Variables** tab to manage them.

### 6. Tests

Tests are assertions you attach to a request to validate its response. They run automatically when you send a request or execute a workflow.

#### Test Types

| Test Type | Description | Example |
|-----------|-------------|---------|
| **Status Equals** | Assert response status code matches | `200` |
| **Status In** | Assert status is one of multiple values | `200, 201, 204` |
| **Header Equals** | Assert a response header value | `Content-Type: application/json` |
| **Body Equals** | Assert a JSON path value matches expected | Path: `data.user.id`, Expected: `123` |
| **Body Exists** | Assert a JSON path exists in response | Path: `data.token` |
| **Duration Less Than** | Assert response time is under threshold | `1000` ms |
| **Response Time Less Than** | Same as duration check | `500` ms |
| **Script** | Write custom JavaScript test logic | See below |

#### Writing Script Tests

Script tests give you full programmatic control. You receive these objects:

- **`pm`** — Test utilities object
- **`request`** — The outgoing request details
- **`response`** — The incoming response details
- **`variables`** — Current variable bundle

##### `pm` object methods

```javascript
// Logging
pm.log("debug message");
pm.info("info message");
pm.warn("warning message");
pm.error("error message");

// Variables
pm.variables.set("key", "value");           // Set runtime + collection variable
pm.variables.setCollection("key", "value"); // Set collection variable only
pm.variables.get("key");                    // Get variable value

// Test assertion
pm.test("description", () => {
  // assertion logic
});
```

##### `request` object

```javascript
{
  id: "req_123",
  name: "Get User",
  url: "https://api.example.com/users/123",
  method: "GET",
  headers: [{ key: "Authorization", value: "Bearer token" }],
  queryParams: [],
  pathParams: [],
  body: undefined
}
```

##### `response` object

```javascript
{
  status: 200,
  headers: {
    "content-type": "application/json",
    "x-request-id": "abc-123"
  },
  body: {
    // Parsed JSON if Content-Type is JSON, otherwise raw string
    id: 123,
    name: "John",
    email: "john@example.com"
  }
}
```

##### `variables` object

```javascript
{
  collection: [{ key: "baseUrl", value: "https://api.example.com", enabled: true, secret: false }],
  request: [{ key: "userId", value: "123", enabled: true, secret: false }],
  runtime: [{ key: "token", value: "xyz", enabled: true, secret: false }]
}
```

#### Script Test Examples

```javascript
// Check status code
pm.test("Status is 200", () => {
  pm.response.status === 200;
});

// Check JSON field
pm.test("User ID is present", () => {
  pm.response.body.id !== undefined;
});

// Check header
pm.test("Content-Type is JSON", () => {
  pm.response.headers["content-type"] === "application/json";
});

// Extract variable
pm.variables.set("userId", pm.response.body.id);

// Conditional logic
if (pm.response.status === 401) {
  pm.warn("Unauthorized - token may be expired");
}

// Loop through array
const users = pm.response.body.users;
pm.test("At least one user", () => users.length > 0);

// Assert all users have email
users.forEach((u) => pm.test(`User ${u.id} has email`, () => u.email.includes("@")));
```

#### Test Results

Each test produces a result with:
- `id` — Unique test ID
- `name` — Test name/description
- `status` — `passed`, `failed`, `skipped`, or `error`
- `durationMs` — Execution time in milliseconds
- `error` — Error message if failed/errored
- `actualValue` — Actual value returned by assertion
- `expectedValue` — Expected value from test config
- `logs` — Console output from script tests

When running a workflow, if any test fails and **Run Tests** is enabled, the workflow stops immediately.

### 7. Pre-Request Scripts

Pre-request scripts run before the request is sent. They let you modify the request or set variables dynamically.

Available in the **Pre-Request** tab. Same API as test scripts (`pm`, `request`, `variables`).

**Common uses:**
- Generate timestamps: `pm.variables.set("timestamp", Date.now());`
- Compute signatures: `pm.variables.set("signature", crypto.subtle.digest(...));`
- Set dynamic headers: modify `request.headers` via variable substitution
- Validate prerequisites before sending

### 8. Variable Extraction

After a request completes, you can extract values from the response into variables for use in subsequent requests.

**How it works:**
1. Go to the **Extract** tab in the request editor
2. Add extraction rules: name + JSON path
3. When the request runs, values are extracted into runtime variables
4. These variables are available to all later requests in a workflow

**JSON Path syntax:**
- `data.user.id` — Access nested object: `response.data.user.id`
- `data.users[0].email` — Access array element: `response.data.users[0].email`
- `$` — Entire response body as string

**Example:**

Response:
```json
{
  "data": {
    "user": {
      "id": 123,
      "name": "John"
    },
    "token": "abc123"
  }
}
```

Extraction rules:
| Name | Path |
|------|------|
| `userId` | `data.user.id` |
| `userName` | `data.user.name` |
| `accessToken` | `data.token` |

### 9. Workflows

A **Workflow** chains multiple requests together. This is useful for:
- Login flows (send OTP -> verify OTP -> get profile)
- CRUD sequences (create -> read -> update -> delete)
- End-to-end testing

#### How Workflows Work

The workflow engine executes steps sequentially:

1. **Initialize** — Load collection variables as the starting variable bundle
2. **For each step**:
   - Check if the step's **condition** is met
   - If condition fails, skip to next step
   - Apply **variable mappings** to prepare request variables
   - Apply **overrides** to modify the request for this step
   - Execute the HTTP request
   - Run **tests** if enabled
   - **Extract** variables from response
   - Record step result
   - Determine **next** action (continue, jump, or end)
3. **Return** — Complete workflow result with all step results and final variable state

#### Creating a Workflow

1. Open a collection
2. Click **Workflows** tab
3. Click **New Workflow**
4. Add steps by selecting requests from the collection

#### Step Configuration

Each step has:

- **Request**: Which API request to execute
- **Condition**: When to run this step
  - `always`: Always run (default)
  - `statusEquals`: Run only if previous response status matches
  - `variableEquals`: Run only if a runtime variable matches a value
  - `expression`: Custom expression (future)
- **Next**: What to do after this step completes
  - `next`: Continue to the next step in sequence
  - `jump`: Jump to a specific step by ID
  - `end`: Stop the workflow here
- **Variable Mappings**: Map source variables to request variables
  - `fromVar` — Source variable name (from collection, request, or runtime)
  - `toVar` — Target request variable name
  - `transform` — Optional transformation: `trim`, `lower`, `upper`, `number`
- **Overrides**: Override request properties for this specific step
  - Path params, query params, headers
  - Request body (for JSON requests)

#### Running a Workflow

1. Open the workflow
2. Click **Run Workflow**
3. Optionally enable **Run Tests** to execute test assertions
4. View results step-by-step with status codes, response bodies, and test outcomes

#### Workflow Execution Result

Each workflow run returns:

```typescript
{
  workflowId: "wf_123",
  ok: true/false,  // Overall success
  steps: [
    {
      stepId: "step_req_123",
      requestName: "Login",
      ok: true/false,
      error?: string,
      requestBody?: string,        // JSON body sent
      responseBody?: string,       // Raw response body
      responseContentType?: string,
      status?: number,             // HTTP status code
      tests: [                     // Test results
        {
          id: "test_1",
          name: "Status is 200",
          status: "passed" | "failed" | "skipped" | "error",
          durationMs: 45,
          error?: string,
          actualValue?: unknown,
          expectedValue?: unknown,
          logs?: [...]
        }
      ]
    }
  ],
  collectionVariables: {
    // Variables that were modified during workflow execution
    "token": "new-value"
  }
}
```

#### Workflow Conditions Details

**`always`**
- Step always executes
- This is the default condition

**`statusEquals`**
- Checks if the previous response status code equals the specified value
- Uses the special `__last_status` runtime variable
- Example: Only run cleanup step if previous step returned 201

**`variableEquals`**
- Checks if a runtime variable equals a specific value
- Example: Only run step if `status` variable equals `active`

**Variable Resolution in Workflows**

When a workflow step needs a variable, it resolves in this order:
1. **Runtime** variables (extracted during current workflow run)
2. **Request** variables (defined on the request itself)
3. **Collection** variables (defined at collection level)

### 10. Execution History

Every request execution is recorded. View history to:
- Debug failed requests
- Compare response changes over time
- Re-run previous requests

History is stored per request and shows:
- Timestamp
- Request method and URL
- Response status and duration
- Response body
- Test results

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
      Tests: Status equals 200
      Extract: token from $.data.token

    - POST /auth/refresh
      Tests: Status equals 200

  Folder: "Users"
    - GET /users/me
      Headers: Authorization: Bearer {{token}}
      Tests: Status equals 200, Body exists $.data

    - GET /users/{{userId}}
      Tests: Status equals 200

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
- Backup `data` directory regularly
- Keep `backend/dist` private; source code is in `backend/src`

---

## License

Private / Proprietary

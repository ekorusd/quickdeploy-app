export type Framework = "go" | "python-fastapi" | "python-flask" | "nodejs-express" | "nodejs-nextjs";
export type Database = "postgresql" | "redis" | "supabase" | "mongodb";
export type Platform = "render" | "vercel" | "docker";

export interface ConfigOptions {
  framework: Framework;
  database: Database;
  platform: Platform;
}

export interface GeneratedConfig {
  filename: string;
  content: string;
  language: "yaml" | "dockerfile" | "json";
  extraFiles?: { filename: string; content: string }[];
}

function dbEnvVars(db: Database): string {
  switch (db) {
    case "postgresql":
      return `DATABASE_URL=postgresql://user:password@localhost:5432/appdb`;
    case "redis":
      return `REDIS_URL=redis://localhost:6379`;
    case "supabase":
      return `SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres`;
    case "mongodb":
      return `MONGODB_URI=mongodb://localhost:27017/appdb`;
  }
}

function dockerfile(opts: ConfigOptions): string {
  const { framework, database } = opts;

  const dbComment = `# Database: ${database}`;

  switch (framework) {
    case "go":
      return `# QuickDeploy — Go
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/server .
${dbComment}
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]`;

    case "python-fastapi":
      return `# QuickDeploy — Python FastAPI
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
${dbComment}
ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`;

    case "python-flask":
      return `# QuickDeploy — Python Flask
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
${dbComment}
ENV PORT=5000
EXPOSE 5000
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]`;

    case "nodejs-express":
      return `# QuickDeploy — Node.js Express
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
${dbComment}
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]`;

    case "nodejs-nextjs":
      return `# QuickDeploy — Next.js
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
${dbComment}
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]`;
  }
}

function dockerCompose(opts: ConfigOptions): string {
  const { database } = opts;
  let dbService = "";

  switch (database) {
    case "postgresql":
      dbService = `  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data`;
      break;
    case "redis":
      dbService = `  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"`;
      break;
    case "mongodb":
      dbService = `  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodata:/data/db`;
      break;
    case "supabase":
      dbService = `  # Supabase is hosted — configure SUPABASE_URL in .env`;
      break;
  }

  const volumes =
    database === "postgresql"
      ? "\nvolumes:\n  pgdata:"
      : database === "mongodb"
        ? "\nvolumes:\n  mongodata:"
        : "";

  return `# QuickDeploy — docker-compose.yml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    env_file:
      - .env
    depends_on:
      - ${database === "supabase" ? "# external supabase" : database === "postgresql" ? "postgres" : database === "mongodb" ? "mongodb" : "redis"}
${dbService}${volumes}`;
}

function renderYaml(opts: ConfigOptions): string {
  const { framework, database } = opts;
  const runtime =
    framework.startsWith("go")
      ? "go"
      : framework.startsWith("python")
        ? "python"
        : "node";

  const buildCmd =
    framework === "go"
      ? "go build -o server ./cmd/server"
      : framework.startsWith("python")
        ? "pip install -r requirements.txt"
        : framework === "nodejs-nextjs"
          ? "npm install && npm run build"
          : "npm install";

  const startCmd =
    framework === "go"
      ? "./server"
      : framework === "python-fastapi"
        ? "uvicorn main:app --host 0.0.0.0 --port $PORT"
        : framework === "python-flask"
          ? "flask run --host=0.0.0.0 --port $PORT"
          : framework === "nodejs-nextjs"
            ? "npm start"
            : "node index.js";

  let dbBlock = "";
  if (database === "postgresql") {
    dbBlock = `
  - type: pserv
    name: quickdeploy-db
    plan: free
    ipAllowList: []`;
  } else if (database === "redis") {
    dbBlock = `
  - type: redis
    name: quickdeploy-redis
    plan: free
    maxmemoryPolicy: allkeys-lru`;
  }

  return `# QuickDeploy — render.yaml
services:
  - type: web
    name: quickdeploy-app
    runtime: ${runtime}
    buildCommand: ${buildCmd}
    startCommand: ${startCmd}
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_CONFIG
        value: ${database}
${dbEnvVars(database)
  .split("\n")
  .map((line) => `      - key: ${line.split("=")[0]}\n        sync: false`)
  .join("\n")}${dbBlock}`;
}

function vercelJson(opts: ConfigOptions): string {
  const { framework, database } = opts;

  const buildCommand =
    framework === "nodejs-nextjs" ? undefined : framework.startsWith("python") ? "pip install -r requirements.txt" : "npm run build";

  const config: Record<string, unknown> = {
    version: 2,
    env: Object.fromEntries(
      dbEnvVars(database)
        .split("\n")
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return [key, rest.join("=")];
        }),
    ),
  };

  if (framework === "nodejs-nextjs") {
    config.framework = "nextjs";
  } else if (framework.startsWith("python")) {
    config.builds = [{ src: "main.py", use: framework === "python-fastapi" ? "@vercel/python" : "@vercel/python" }];
    config.routes = [{ src: "/(.*)", dest: "main.py" }];
  } else if (buildCommand) {
    config.buildCommand = buildCommand;
  }

  return JSON.stringify(config, null, 2);
}

export function generateConfig(opts: ConfigOptions): GeneratedConfig {
  const { platform } = opts;

  if (platform === "docker") {
    return {
      filename: "Dockerfile",
      content: dockerfile(opts),
      language: "dockerfile",
      extraFiles: [
        { filename: "docker-compose.yml", content: dockerCompose(opts) },
        { filename: ".env.example", content: dbEnvVars(opts.database) },
      ],
    };
  }

  if (platform === "render") {
    return {
      filename: "render.yaml",
      content: renderYaml(opts),
      language: "yaml",
      extraFiles: [{ filename: ".env.example", content: dbEnvVars(opts.database) }],
    };
  }

  return {
    filename: "vercel.json",
    content: vercelJson(opts),
    language: "json",
    extraFiles: [{ filename: ".env.example", content: dbEnvVars(opts.database) }],
  };
}

export const FRAMEWORK_OPTIONS = [
  { value: "go" as const, label: "Go", sub: "Standard library / Gin" },
  { value: "python-fastapi" as const, label: "Python", sub: "FastAPI" },
  { value: "python-flask" as const, label: "Python", sub: "Flask" },
  { value: "nodejs-express" as const, label: "Node.js", sub: "Express" },
  { value: "nodejs-nextjs" as const, label: "Node.js", sub: "Next.js" },
];

export const DATABASE_OPTIONS = [
  { value: "postgresql" as const, label: "PostgreSQL", icon: "database" },
  { value: "redis" as const, label: "Redis", icon: "zap" },
  { value: "supabase" as const, label: "Supabase", icon: "cloud" },
  { value: "mongodb" as const, label: "MongoDB", icon: "leaf" },
];

export const PLATFORM_OPTIONS = [
  { value: "render" as const, label: "Render", desc: "Managed PaaS" },
  { value: "vercel" as const, label: "Vercel", desc: "Edge deployment" },
  { value: "docker" as const, label: "Docker / VPS", desc: "Self-hosted" },
];

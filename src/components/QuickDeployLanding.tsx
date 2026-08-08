"use client";

import { useCallback, useMemo, useState } from "react";
import JSZip from "jszip";
import {
  Check,
  Copy,
  Database,
  Download,
  Cloud,
  Container,
  Globe,
  Leaf,
  Rocket,
  Server,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  DATABASE_OPTIONS,
  FRAMEWORK_OPTIONS,
  PLATFORM_OPTIONS,
  generateConfig,
} from "@/lib/generateConfig";
import type {
  ConfigOptions,
  Database as DatabaseType,
  Framework,
  Platform,
} from "@/lib/generateConfig";

function GoldenSnail({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M18 38c-4 0-7-3-7-7s3-7 7-7c1.2 0 2.3.3 3.3.8C23.5 20.5 27 18 31 18c6.1 0 11 4.9 11 11 0 .8-.1 1.5-.2 2.2 2.1.9 3.7 3 3.7 5.5 0 3.3-2.7 6-6 6H18z"
        fill="#D4AF37"
        opacity="0.25"
      />
      <path
        d="M31 20c-5.5 0-10 4.5-10 10 0 1.1.2 2.1.5 3-2.5 1.2-4.2 3.7-4.2 6.6 0 4 3.2 7.2 7.2 7.2h22.5c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.2-3.9-4.5-.3-6.2-5.4-11.1-11.6-11.1-1.8 0-3.5.4-5 1.1C29.8 21.2 30.4 20 31 20z"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 44c-2 2-2 5 0 7M10 48c-1.5 1.5-1.5 4 0 5.5"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="42" cy="33" r="1.5" fill="#0ea5e9" />
      <path
        d="M36 28c1.5-1 3.5-1 5 0"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const DB_ICONS = {
  database: Database,
  zap: Zap,
  cloud: Cloud,
  leaf: Leaf,
} as const;

const PLATFORM_ICONS = {
  render: Globe,
  vercel: Rocket,
  docker: Container,
} as const;

function highlightCode(code: string, language: "yaml" | "dockerfile" | "json"): string {
  if (language === "json") {
    return code
      .replace(/("(?:\\.|[^"\\])*")(\s*:)/g, '<span class="text-cyber-blue">$1</span>$2')
      .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span class="text-gold">$1</span>')
      .replace(/\b(true|false|null|\d+)\b/g, '<span class="text-emerald-400">$1</span>');
  }

  return code
    .replace(/^(#.*)$/gm, '<span class="text-zinc-500 italic">$1</span>')
    .replace(/\b(FROM|WORKDIR|COPY|RUN|ENV|EXPOSE|CMD|AS|services|type|name|runtime|buildCommand|startCommand|envVars|depends_on|volumes|image|ports|environment|plan)\b/g, '<span class="text-cyber-blue">$1</span>')
    .replace(/(["'][^"']*["'])/g, '<span class="text-gold">$1</span>');
}

export default function QuickDeployLanding() {
  const [framework, setFramework] = useState<Framework>("nodejs-nextjs");
  const [database, setDatabase] = useState<DatabaseType>("postgresql");
  const [platform, setPlatform] = useState<Platform>("docker");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const options: ConfigOptions = useMemo(
    () => ({ framework, database, platform }),
    [framework, database, platform],
  );

  const config = useMemo(() => generateConfig(options), [options]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(config.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [config.content]);

  const handleDownload = useCallback(async () => {
    const zip = new JSZip();
    zip.file(config.filename, config.content);
    config.extraFiles?.forEach((file) => zip.file(file.filename, file.content));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "quickdeploy-config.zip";
    anchor.click();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [config]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b12] text-zinc-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-amber-400/20 bg-amber-400/5 px-4 py-1.5 text-sm text-amber-300/90">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Deployment configs in seconds
          </div>

          <div className="mb-4 flex items-center justify-center gap-4">
            <GoldenSnail className="h-14 w-14 drop-shadow-[0_0_12px_rgba(212,175,55,0.45)]" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-amber-300 via-[#D4AF37] to-amber-500 bg-clip-text text-transparent">
                QuickDeploy
              </span>
            </h1>
          </div>

          <p className="mx-auto max-w-xl text-lg text-zinc-400">
            <span className="text-amber-400/90">Instant Configs,</span>{" "}
            <span className="text-cyan-400">Gold Standard</span>
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-6">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-sm">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                <Server className="h-4 w-4 text-cyan-400" />
                Deployment Configuration
              </h2>

              <div className="space-y-5">
                <fieldset>
                  <legend className="mb-3 text-sm font-medium text-zinc-300">Framework</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FRAMEWORK_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFramework(opt.value)}
                        className={`rounded-xl border px-4 py-3 text-left transition-all ${
                          framework === opt.value
                            ? "border-amber-400/60 bg-amber-400/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                            : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                        }`}
                      >
                        <span className="block text-sm font-medium text-zinc-100">{opt.label}</span>
                        <span className="text-xs text-zinc-500">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-medium text-zinc-300">Database</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {DATABASE_OPTIONS.map((opt) => {
                      const Icon = DB_ICONS[opt.icon as keyof typeof DB_ICONS];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDatabase(opt.value)}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-3 transition-all ${
                            database === opt.value
                              ? "border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                              : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              database === opt.value ? "text-cyan-400" : "text-zinc-500"
                            }`}
                          />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-medium text-zinc-300">Target Platform</legend>
                  <div className="grid gap-2">
                    {PLATFORM_OPTIONS.map((opt) => {
                      const Icon = PLATFORM_ICONS[opt.value];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPlatform(opt.value)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                            platform === opt.value
                              ? "border-amber-400/60 bg-gradient-to-r from-amber-400/10 to-cyan-400/5 shadow-[0_0_20px_rgba(212,175,55,0.12)]"
                              : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              platform === opt.value ? "text-amber-400" : "text-zinc-500"
                            }`}
                          />
                          <div>
                            <span className="block text-sm font-medium">{opt.label}</span>
                            <span className="text-xs text-zinc-500">{opt.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </div>
          </section>

          <section className="flex flex-col">
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-2 font-mono text-xs text-zinc-500">{config.filename}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      copied
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
                    }`}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      downloaded
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/50"
                    }`}
                  >
                    {downloaded ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {downloaded ? "Downloaded!" : "Download Zip"}
                  </button>
                </div>
              </div>

              <div className="relative flex-1 overflow-auto p-4">
                <pre className="font-mono text-xs leading-relaxed text-zinc-300 sm:text-sm">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(config.content, config.language),
                    }}
                  />
                </pre>
              </div>

              {config.extraFiles && config.extraFiles.length > 0 && (
                <div className="border-t border-zinc-800 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Also included in zip:{" "}
                    <span className="text-zinc-400">
                      {config.extraFiles.map((f) => f.filename).join(", ")}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-12 text-center text-xs text-zinc-600">
          QuickDeploy — generate production-ready deployment configs instantly
        </footer>
      </div>
    </div>
  );
}

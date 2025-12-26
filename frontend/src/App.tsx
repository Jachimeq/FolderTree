import React, { useMemo, useState } from "react";
import { Sparkles, Play, Settings, Copy, Folder, FileText, Download, Wand2, Layers, Trash2, Search, FolderTree, Moon, Sun } from "lucide-react";
import { aiGenerate, applyTree, previewTree, planFromText, planFromPrompt, scanCleanup, applyCleanup, analyzeDirectory, planReorganize, applyReorganize } from "./api/ops";
import { setApiKey } from "./api/client";
import { useAppStore } from "./store/useAppStore";
import PlanPanel from "./components/PlanPanel";
import CleanupPanel from "./components/CleanupPanel";

type Provider = "ollama" | "openai";
type ActiveTab = "paste" | "plan" | "cleanup" | "organize";

function isFile(name: string) {
  return /\.[a-z0-9]+$/i.test(name);
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("paste");
  const [provider, setProvider] = useState<Provider>("ollama");
  const [model, setModel] = useState<string>("");
  const [apiKey, setApiKeyState] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);

  const [outputDir, setOutputDir] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState<string>("Create a clean monorepo with backend (Express) and frontend (React) and shared types.");
  const [pastedTree, setPastedTree] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [previewCount, setPreviewCount] = useState<number>(0);
  const [ops, setOps] = useState<{ op: string; path: string }[]>([]);
  const [status, setStatus] = useState<string>("");

  // Cleanup state
  const [cleanupRoot, setCleanupRoot] = useState<string>("");
  const [cleanupOptions, setCleanupOptions] = useState({
    includeEmptyDirs: true,
    includeLargeFiles: true,
    includeDuplicates: true,
    includeCaches: true,
    maxFileSizeMB: 50,
    hashDuplicates: false,
    maxDepth: 3,
    excludeNames: [] as string[],
    followSymlinks: false,
    duplicateStrategy: 'size' as 'size' | 'hash' | 'nameSize',
  });

  // Organize state
  const [organizeRoot, setOrganizeRoot] = useState<string>("");
  const [organizeMaxDepth, setOrganizeMaxDepth] = useState<number>(3);
  const [organizeExcludeNames, setOrganizeExcludeNames] = useState<string[]>([]);
  const [organizeGroupBy, setOrganizeGroupBy] = useState<'semantic' | 'language' | 'framework'>("semantic");

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const {
    currentPlan,
    setPlan,
    currentCleanupPlan,
    setCleanupPlan,
    selectedCleanupPaths,
    toggleCleanupPath,
    clearCleanupSelection,
    currentOrganizeAnalysis,
    setOrganizeAnalysis,
    currentReorganizePlan,
    setReorganizePlan,
  } = useAppStore();

  const flatPreview = useMemo(() => {
    // keep it cheap: show first 400 ops
    return ops.slice(0, 400);
  }, [ops]);

  const doPreview = async () => {
    setBusy(true);
    setStatus("Previewing…");
    try {
      const res = await previewTree(pastedTree, outputDir || undefined);
      setOps(res.ops);
      setPreviewCount(res.count);
      setStatus(`Preview OK. Operations: ${res.count}`);
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Preview failed");
    } finally {
      setBusy(false);
    }
  };

  const doApply = async () => {
    setBusy(true);
    setStatus("Applying…");
    try {
      const res = await applyTree(pastedTree, outputDir || undefined, true);
      setStatus(`Done. Created/ensured: ${res.created} items in: ${res.outputDir}`);
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Apply failed");
    } finally {
      setBusy(false);
    }
  };

  const doAIGenerate = async () => {
    setBusy(true);
    setStatus("Generating with AI…");
    try {
      const res = await aiGenerate(aiPrompt, provider, model || undefined);
      setPastedTree(res.text);
      setStatus("AI generated. Run Preview → Apply.");
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "AI generate failed");
    } finally {
      setBusy(false);
    }
  };

  const doPlanFromText = async () => {
    setBusy(true);
    setStatus("Planning from text…");
    try {
      const res = await planFromText(pastedTree, outputDir || undefined);
      setPlan(res.plan);
      setActiveTab("plan");
      setStatus("Plan ready. Review and apply.");
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Plan failed");
    } finally {
      setBusy(false);
    }
  };

  const doPlanFromPrompt = async () => {
    setBusy(true);
    setStatus("Planning from AI prompt…");
    try {
      const res = await planFromPrompt(aiPrompt, provider, model || undefined, outputDir || undefined);
      setPlan(res.plan);
      setPastedTree(res.text);
      setActiveTab("plan");
      setStatus("AI plan ready. Review and apply.");
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Plan from prompt failed");
    } finally {
      setBusy(false);
    }
  };

  const doApplyPlan = async () => {
    if (!currentPlan) return;
    setBusy(true);
    setStatus("Applying plan…");
    try {
      const res = await applyTree(pastedTree, currentPlan.outputDir, true, false);
      setStatus(`Done. Created: ${res.created} items in: ${res.outputDir}`);
      setPlan(null);
      setActiveTab("paste");
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Apply failed");
    } finally {
      setBusy(false);
    }
  };

  const doScanCleanup = async () => {
    setBusy(true);
    setStatus("Scanning for cleanup…");
    try {
      const res = await scanCleanup(cleanupRoot || undefined, cleanupOptions);
      setCleanupPlan(res.plan);
      setStatus(`Scan complete. Found ${res.plan.items.length} items.`);
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Scan failed");
    } finally {
      setBusy(false);
    }
  };

  const doApplyCleanup = async (paths?: string[]) => {
    if (!currentCleanupPlan) return;
    setBusy(true);
    setStatus("Applying cleanup…");
    try {
      const res = await applyCleanup(currentCleanupPlan, paths);
      setStatus(`Cleanup complete. Deleted: ${res.deleted} items, freed: ${(res.freedBytes / 1024 / 1024).toFixed(2)} MB`);
      setCleanupPlan(null);
      clearCleanupSelection();
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Cleanup failed");
    } finally {
      setBusy(false);
    }
  };

  const doAnalyzeDirectory = async () => {
    setBusy(true);
    setStatus("Analyzing directory...");
    try {
      const res = await analyzeDirectory(organizeRoot || undefined, organizeMaxDepth, true, organizeExcludeNames);
      setOrganizeAnalysis(res.analysis);
      setStatus(`Analysis complete. Found ${res.analysis.items.length} items.`);
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Analysis failed");
    } finally {
      setBusy(false);
    }
  };

  const doPlanReorganize = async () => {
    setBusy(true);
    setStatus("Planning reorganization...");
    try {
      const res = await planReorganize(organizeRoot || undefined, organizeMaxDepth, organizeExcludeNames, organizeGroupBy);
      setOrganizeAnalysis(res.analysis);
      setReorganizePlan(res.plan);
      setStatus(`Plan ready. ${res.plan.moves.length} moves, ${res.plan.creates.length} new folders.`);
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Plan failed");
    } finally {
      setBusy(false);
    }
  };

  const doApplyReorganize = async () => {
    if (!currentReorganizePlan) return;
    setBusy(true);
    setStatus("Applying reorganization...");
    try {
      const res = await applyReorganize(currentReorganizePlan);
      setStatus(`Reorganization complete. Moved: ${res.moved}, Created: ${res.created}`);
      setReorganizePlan(null);
      setOrganizeAnalysis(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e?.message || "Reorganize failed");
    } finally {
      setBusy(false);
    }
  };

  const applySettings = () => {
    setApiKey(apiKey.trim());
    setStatus("Settings applied.");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800">
        <div className="flex items-center gap-2 font-semibold tracking-wide">
          <Wand2 size={18} className="text-blue-400" />
          FolderTree<span className="text-blue-400">PRO</span>
          <span className="text-xs text-neutral-400 ml-2">AI-powered • cleanup • planning</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`btn-secondary inline-flex items-center gap-2 ${activeTab === "paste" ? "bg-blue-500/20" : ""}`}
            onClick={() => setActiveTab("paste")}
          >
            <FileText size={16} />
            Paste
          </button>
          <button
            className={`btn-secondary inline-flex items-center gap-2 ${activeTab === "plan" ? "bg-blue-500/20" : ""}`}
            onClick={() => setActiveTab("plan")}
          >
            <Layers size={16} />
            Plan {currentPlan && "(1)"}
          </button>
          <button
            className={`btn-secondary inline-flex items-center gap-2 ${activeTab === "cleanup" ? "bg-blue-500/20" : ""}`}
            onClick={() => setActiveTab("cleanup")}
          >
            <Trash2 size={16} />
            Cleanup
          </button>
          <button
            className={`btn-secondary inline-flex items-center gap-2 ${activeTab === "organize" ? "bg-blue-500/20" : ""}`}
            onClick={() => setActiveTab("organize")}
          >
            <FolderTree size={16} />
            Organize
          </button>
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={toggleDarkMode}
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => downloadText("structure.txt", pastedTree || "")}
            disabled={!pastedTree}
            title="Export pasted/generated tree as .txt"
          >
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary inline-flex items-center gap-2" onClick={doAIGenerate} disabled={busy}>
            <Sparkles size={16} />
            AI Generate
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-4 p-4">
        {activeTab === "paste" && (
          <>
            {/* Left: Paste & Preview */}
            <section className="col-span-12 lg:col-span-7 space-y-3">
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Paste mode</div>
                    <div className="card-subtitle">Paste structure (plain text or markdown). 2 spaces per level.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary inline-flex items-center gap-2" onClick={() => navigator.clipboard.writeText(pastedTree || "")} disabled={!pastedTree}>
                      <Copy size={16} /> Copy
                    </button>
                  </div>
                </div>

                <textarea
                  className="textarea"
                  value={pastedTree}
                  onChange={(e) => setPastedTree(e.target.value)}
                  placeholder={`my-project\n  src\n    index.ts\n  package.json`}
                />

                <div className="flex flex-wrap gap-2 pt-3">
                  <input
                    className="input flex-1 min-w-[260px]"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="Output dir (optional). Default: backend/generated"
                  />
                  <button className="btn-secondary inline-flex items-center gap-2" onClick={doPreview} disabled={busy || !pastedTree.trim()}>
                    <Play size={16} /> Preview
                  </button>
                  <button className="btn-primary inline-flex items-center gap-2" onClick={doApply} disabled={busy || !pastedTree.trim()}>
                    <Play size={16} /> Apply
                  </button>
                  <button className="btn-secondary inline-flex items-center gap-2" onClick={doPlanFromText} disabled={busy || !pastedTree.trim()}>
                    <Layers size={16} /> Plan
                  </button>
                </div>

                <div className="mt-3 text-xs text-neutral-400">
                  {status || "Ready."}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Preview</div>
                    <div className="card-subtitle">Operations: {previewCount} (showing max 400)</div>
                  </div>
                </div>
                <div className="max-h-[360px] overflow-auto rounded border border-neutral-800 bg-neutral-950">
                  {flatPreview.length === 0 ? (
                    <div className="p-3 text-sm text-neutral-500">No preview. Click Preview.</div>
                  ) : (
                    <ul className="divide-y divide-neutral-900">
                      {flatPreview.map((o, idx) => (
                        <li key={idx} className="px-3 py-2 text-sm flex items-center gap-2">
                          {o.op === "mkdir" ? <Folder size={16} className="text-blue-400" /> : <FileText size={16} className="text-neutral-300" />}
                          <span className="text-neutral-200">{o.op}</span>
                          <span className="text-neutral-500 truncate">{o.path}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* Right: AI + Settings */}
            <section className="col-span-12 lg:col-span-5 space-y-3">
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">AI generator</div>
                    <div className="card-subtitle">Free local AI (Ollama) by default. OpenAI optional.</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="label">
                    Provider
                    <select className="select" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
                      <option value="ollama">Ollama (local)</option>
                      <option value="openai">OpenAI (API)</option>
                    </select>
                  </label>

                  <label className="label">
                    Model (optional)
                    <input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder={provider === "ollama" ? "mistral" : "gpt-4o-mini"} />
                  </label>
                </div>

                <label className="label mt-2">
                  Prompt
                  <textarea className="textarea h-28" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                </label>

                <div className="pt-3 flex gap-2">
                  <button className="btn-primary flex-1 inline-flex items-center justify-center gap-2" onClick={doAIGenerate} disabled={busy}>
                    <Sparkles size={16} /> Generate
                  </button>
                  <button className="btn-secondary inline-flex items-center gap-2" onClick={doPlanFromPrompt} disabled={busy}>
                    <Layers size={16} /> Plan
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-neutral-300" />
                    <div>
                      <div className="card-title">Settings</div>
                      <div className="card-subtitle">API key is optional. Works with Ollama without it.</div>
                    </div>
                  </div>
                </div>

                <label className="label">
                  x-api-key (optional)
                  <input className="input" value={apiKey} onChange={(e) => setApiKeyState(e.target.value)} placeholder="Only if backend has API_KEY set" />
                </label>

                <button className="btn-secondary w-full mt-3" onClick={applySettings}>
                  Apply settings
                </button>

                <div className="mt-3 text-xs text-neutral-500">
                  Tip: If Ollama error — ensure <code className="px-1 py-0.5 bg-neutral-900 rounded">ollama serve</code> is running.
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "plan" && (
          <section className="col-span-12">
            <PlanPanel
              plan={currentPlan}
              onApply={doApplyPlan}
              onCancel={() => {
                setPlan(null);
                setActiveTab("paste");
              }}
              busy={busy}
            />
          </section>
        )}

        {activeTab === "organize" && (
          <>
            <section className="col-span-12 lg:col-span-8">
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Directory Analysis</div>
                    <div className="card-subtitle">Content-aware classification & reorganization</div>
                  </div>
                </div>

                {currentOrganizeAnalysis && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
                        <div className="text-xs text-neutral-400">Total Files</div>
                        <div className="text-2xl font-semibold text-blue-400">{currentOrganizeAnalysis.stats.totalFiles}</div>
                      </div>
                      <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
                        <div className="text-xs text-neutral-400">Total Dirs</div>
                        <div className="text-2xl font-semibold text-neutral-200">{currentOrganizeAnalysis.stats.totalDirs}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-neutral-300 mb-2">Languages Detected</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(currentOrganizeAnalysis.stats.languages).map(([lang, count]) => (
                          <span key={lang} className="px-2 py-1 rounded bg-blue-500/20 text-blue-200 text-xs">
                            {lang}: {count}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-neutral-300 mb-2">Semantic Types</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(currentOrganizeAnalysis.stats.semanticTypes).map(([type, count]) => (
                          <span key={type} className="px-2 py-1 rounded bg-green-500/20 text-green-200 text-xs">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>

                    {currentReorganizePlan && (
                      <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30">
                        <div className="text-sm font-medium text-yellow-200 mb-2">Reorganization Plan</div>
                        <div className="text-xs text-neutral-400">
                          {currentReorganizePlan.moves.length} files to move, {currentReorganizePlan.creates.length} folders to create
                        </div>
                        <button
                          className="btn-primary mt-2 w-full"
                          onClick={doApplyReorganize}
                          disabled={busy}
                        >
                          Apply Reorganization
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!currentOrganizeAnalysis && (
                  <div className="p-4 text-center text-neutral-500">
                    <FolderTree size={24} className="mx-auto mb-2" />
                    No analysis yet. Configure and run scan.
                  </div>
                )}
              </div>
            </section>

            <section className="col-span-12 lg:col-span-4 space-y-3">
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Organize Settings</div>
                    <div className="card-subtitle">Configure analysis</div>
                  </div>
                </div>

                <label className="label">
                  Root directory
                  <input
                    className="input"
                    value={organizeRoot}
                    onChange={(e) => setOrganizeRoot(e.target.value)}
                    placeholder="Leave empty for current workspace"
                  />
                </label>

                <label className="label mt-3">
                  Max depth
                  <input
                    type="number"
                    className="input"
                    value={organizeMaxDepth}
                    onChange={(e) => setOrganizeMaxDepth(parseInt(e.target.value) || 3)}
                    min="1"
                    max="10"
                  />
                </label>

                <label className="label mt-3">
                  Exclude names (comma separated)
                  <input
                    className="input"
                    placeholder="e.g. node_modules,.git,dist"
                    onChange={(e) => setOrganizeExcludeNames(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                </label>

                <label className="label mt-3">
                  Group by
                  <select
                    className="select"
                    value={organizeGroupBy}
                    onChange={(e) => setOrganizeGroupBy(e.target.value as any)}
                  >
                    <option value="semantic">Semantic Type</option>
                    <option value="language">Language</option>
                    <option value="framework">Framework</option>
                  </select>
                </label>

                <div className="flex gap-2 mt-4">
                  <button className="btn-primary flex-1" onClick={doAnalyzeDirectory} disabled={busy}>
                    Analyze
                  </button>
                  <button className="btn-secondary flex-1" onClick={doPlanReorganize} disabled={busy}>
                    Plan Reorg
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "cleanup" && (
          <>
            <section className="col-span-12 lg:col-span-8">
              <CleanupPanel
                plan={currentCleanupPlan}
                selectedPaths={selectedCleanupPaths}
                onTogglePath={toggleCleanupPath}
                onClearSelection={clearCleanupSelection}
                onApplyCleanup={doApplyCleanup}
                busy={busy}
              />
            </section>
            <section className="col-span-12 lg:col-span-4 space-y-3">
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Cleanup Scan</div>
                    <div className="card-subtitle">Configure and run scan</div>
                  </div>
                </div>

                <label className="label">
                  Root directory
                  <input
                    className="input"
                    value={cleanupRoot}
                    onChange={(e) => setCleanupRoot(e.target.value)}
                    placeholder="Leave empty for current workspace"
                  />
                </label>

                <div className="space-y-2 mt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cleanupOptions.includeEmptyDirs}
                      onChange={(e) => setCleanupOptions({ ...cleanupOptions, includeEmptyDirs: e.target.checked })}
                    />
                    <span>Empty directories</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cleanupOptions.includeLargeFiles}
                      onChange={(e) => setCleanupOptions({ ...cleanupOptions, includeLargeFiles: e.target.checked })}
                    />
                    <span>Large files</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cleanupOptions.includeDuplicates}
                      onChange={(e) => setCleanupOptions({ ...cleanupOptions, includeDuplicates: e.target.checked })}
                    />
                    <span>Duplicates</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cleanupOptions.includeCaches}
                      onChange={(e) => setCleanupOptions({ ...cleanupOptions, includeCaches: e.target.checked })}
                    />
                    <span>Cache directories</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cleanupOptions.hashDuplicates}
                      onChange={(e) => setCleanupOptions({ ...cleanupOptions, hashDuplicates: e.target.checked, duplicateStrategy: e.target.checked ? 'hash' : cleanupOptions.duplicateStrategy })}
                    />
                    <span>Hash-verify duplicates (slower)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cleanupOptions.followSymlinks}
                      onChange={(e) => setCleanupOptions({ ...cleanupOptions, followSymlinks: e.target.checked })}
                    />
                    <span>Follow symlinks</span>
                  </label>
                </div>

                <label className="label mt-3">
                  Large file threshold (MB)
                  <input
                    type="number"
                    className="input"
                    value={cleanupOptions.maxFileSizeMB}
                    onChange={(e) => setCleanupOptions({ ...cleanupOptions, maxFileSizeMB: parseInt(e.target.value) || 50 })}
                  />
                </label>

                <label className="label mt-3">
                  Max depth
                  <input
                    type="number"
                    className="input"
                    value={cleanupOptions.maxDepth}
                    onChange={(e) => setCleanupOptions({ ...cleanupOptions, maxDepth: parseInt(e.target.value) || 3 })}
                    min="0"
                    max="20"
                  />
                </label>

                <label className="label mt-3">
                  Exclude names (comma separated)
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. node_modules,.git,dist"
                    onChange={(e) => setCleanupOptions({ ...cleanupOptions, excludeNames: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  />
                </label>

                <label className="label mt-3">
                  Duplicate strategy
                  <select
                    className="select"
                    value={cleanupOptions.duplicateStrategy}
                    onChange={(e) => setCleanupOptions({ ...cleanupOptions, duplicateStrategy: e.target.value as any })}
                  >
                    <option value="size">Size only</option>
                    <option value="nameSize">Name + Size</option>
                    <option value="hash">Hash (slow)</option>
                  </select>
                </label>

                <button
                  className="btn-primary w-full mt-3 inline-flex items-center justify-center gap-2"
                  onClick={doScanCleanup}
                  disabled={busy}
                >
                  <Search size={16} />
                  {busy ? "Scanning..." : "Scan Directory"}
                </button>

                <div className="mt-3 text-xs text-neutral-400">
                  {status || "Configure options and scan."}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "organize" && (
          <>
            <section className="col-span-12 lg:col-span-7 space-y-3">
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Auto-Organize Directory</div>
                    <div className="card-subtitle">Classify files and suggest reorganization by type</div>
                  </div>
                </div>

                <label className="label">
                  Root directory to analyze
                  <input
                    type="text"
                    className="input"
                    placeholder="Leave empty for current directory"
                    value={organizeRoot}
                    onChange={(e) => setOrganizeRoot(e.target.value)}
                  />
                </label>

                <label className="label mt-3">
                  Max depth
                  <input
                    type="number"
                    className="input"
                    value={organizeMaxDepth}
                    onChange={(e) => setOrganizeMaxDepth(parseInt(e.target.value) || 3)}
                  />
                </label>

                <div className="flex gap-2 mt-3">
                  <button
                    className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                    onClick={doAnalyzeDirectory}
                    disabled={busy}
                  >
                    <Search size={16} />
                    {busy ? "Analyzing..." : "Analyze Only"}
                  </button>
                  <button
                    className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                    onClick={doPlanReorganize}
                    disabled={busy}
                  >
                    <FolderTree size={16} />
                    {busy ? "Planning..." : "Plan Reorganize"}
                  </button>
                </div>

                {currentReorganizePlan && (
                  <button
                    className="btn-primary w-full mt-3 inline-flex items-center justify-center gap-2"
                    onClick={doApplyReorganize}
                    disabled={busy}
                  >
                    <Play size={16} />
                    {busy ? "Applying..." : `Apply Plan (${currentReorganizePlan.moves.length} moves)`}
                  </button>
                )}

                <div className="mt-3 text-xs text-neutral-400">
                  {status || "Enter directory path and analyze."}
                </div>
              </div>

              {currentOrganizeAnalysis && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Analysis Results</div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                      <div className="text-xs text-neutral-400">Files</div>
                      <div className="text-xl font-semibold text-blue-400">{currentOrganizeAnalysis.stats.totalFiles}</div>
                    </div>
                    <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                      <div className="text-xs text-neutral-400">Dirs</div>
                      <div className="text-xl font-semibold text-green-400">{currentOrganizeAnalysis.stats.totalDirs}</div>
                    </div>
                    <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                      <div className="text-xs text-neutral-400">Languages</div>
                      <div className="text-xl font-semibold text-yellow-400">{Object.keys(currentOrganizeAnalysis.stats.languages).length}</div>
                    </div>
                    <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                      <div className="text-xs text-neutral-400">Types</div>
                      <div className="text-xl font-semibold text-purple-400">{Object.keys(currentOrganizeAnalysis.stats.semanticTypes).length}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-medium text-neutral-300 mb-2">Languages Detected</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(currentOrganizeAnalysis.stats.languages).map(([lang, count]) => (
                        <span key={lang} className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
                          {lang}: {count}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-medium text-neutral-300 mb-2">Semantic Types</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(currentOrganizeAnalysis.stats.semanticTypes).map(([type, count]) => (
                        <span key={type} className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentReorganizePlan && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Reorganization Plan</div>
                  </div>

                  <div className="text-sm text-neutral-300 mb-2">
                    <strong>{currentReorganizePlan.moves.length}</strong> files to move, <strong>{currentReorganizePlan.creates.length}</strong> folders to create
                  </div>

                  <div className="max-h-64 overflow-auto rounded border border-neutral-800 bg-neutral-950">
                    <ul className="divide-y divide-neutral-900">
                      {currentReorganizePlan.moves.slice(0, 50).map((move, idx) => (
                        <li key={idx} className="px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-blue-400 flex-shrink-0" />
                            <span className="text-neutral-400 truncate flex-1">{move.from}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 ml-5">
                            <span className="text-green-400">→</span>
                            <span className="text-green-300 truncate flex-1">{move.to}</span>
                          </div>
                          <div className="ml-5 mt-0.5 text-neutral-500">{move.reason}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>

            <section className="col-span-12 lg:col-span-5 space-y-3">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">About Auto-Organize</div>
                </div>
                <div className="text-sm text-neutral-400 space-y-2">
                  <p>
                    Auto-organize scans your directory, classifies files by language, framework, and semantic type (code/tests/docs/build/assets/etc), then suggests a reorganization plan.
                  </p>
                  <p>
                    <strong>Features:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Language detection (JS/TS/Python/Go/Java/etc)</li>
                    <li>Framework recognition (React/Vue/Django/Spring/etc)</li>
                    <li>Semantic classification (code/tests/config/docs/build/assets/logs/cache)</li>
                    <li>Safe plan preview before applying</li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

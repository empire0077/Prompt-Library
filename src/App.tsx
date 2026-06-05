import React, { useState, useEffect } from "react";
import { 
  Plus, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Layout, 
  Lock, 
  Globe, 
  Star, 
  ChevronRight, 
  Copy, 
  Zap, 
  User, 
  Layers, 
  Check, 
  AlertCircle
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PromptCard from "./components/PromptCard";
import DetailPanel from "./components/DetailPanel";
import QuickSaveDrawer from "./components/QuickSaveDrawer";
import { HydratedPrompt, DbCategory, DbTool, DbUser } from "./types";

export default function App() {
  // State variables for list and catalogs
  const [prompts, setPrompts] = useState<HydratedPrompt[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [tools, setTools] = useState<DbTool[]>([]);
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);

  // Filter conditions
  const [activeTab, setActiveTab] = useState<string>("all"); // 'all', 'private', 'public', 'favorites'
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("recently_updated");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Selected item and drawer triggers
  const [selectedPrompt, setSelectedPrompt] = useState<HydratedPrompt | null>(null);
  const [isQuickSaveOpen, setIsQuickSaveOpen] = useState<boolean>(false);

  // Feedback State (Toasts)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Load catalogs on mount
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [catRes, toolRes, userRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tools"),
          fetch("/api/session")
        ]);
        
        if (catRes.ok) setCategories(await catRes.json());
        if (toolRes.ok) setTools(await toolRes.json());
        if (userRes.ok) setCurrentUser(await userRes.json());
      } catch (err) {
        console.error("Error loading catalogs:", err);
      }
    };

    fetchCatalogs();
  }, []);

  // Fetch / Query Prompts whenever filter states change
  const fetchPromptsData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedTool) params.append("tool", selectedTool);
      if (selectedType) params.append("type", selectedType);
      if (sortOrder) params.append("sort", sortOrder);
      if (activeTab) params.append("tab", activeTab);
      if (selectedCategory) params.append("category", selectedCategory);

      const res = await fetch(`/api/prompts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
        
        // Retain selection if the active selection still exists in the fetched results
        if (selectedPrompt) {
          const matched = data.find((p: HydratedPrompt) => p.id === selectedPrompt.id);
          if (matched) {
            setSelectedPrompt(matched);
          }
        }
      }
    } catch (err) {
      console.error("Error pulling prompts:", err);
    }
  };

  useEffect(() => {
    fetchPromptsData();
  }, [activeTab, selectedCategory, searchQuery, selectedTool, selectedType, sortOrder]);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTool("");
    setSelectedType("");
    setSortOrder("recently_updated");
    setSelectedCategory(null);
    showToast("Filters reset", "info");
  };

  // Save new Quick Saved prompt
  const handleSavePrompt = async (payload: {
    title: string;
    description: string;
    content: string;
    type: string;
    tool: string;
    visibility: 'private' | 'public';
    tags: string[];
  }) => {
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to post prompt");
      }

      const newPrompt = await response.json();
      showToast("💾 Saved new prompt into Library successfully!");
      fetchPromptsData();
    } catch (error) {
      console.error("Error committing quick save prompt", error);
      throw error;
    }
  };

  // Favorite toggle trigger
  const handleToggleFavorite = async (id: string) => {
    try {
      const response = await fetch("/api/prompts/toggle-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        const data = await response.json();
        const stateMessage = data.is_favorite 
          ? "⭐ Added to Favorites list" 
          : "Removed from Favorites list";
        showToast(stateMessage);
        
        // Record favored event
        if (data.is_favorite) {
          fetch("/api/prompts/record-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, eventType: "favorite" })
          });
        }
        
        fetchPromptsData();
      }
    } catch (error) {
      console.error("Error favoriting prompt:", error);
    }
  };

  // Visibility toggle (Publish / Private)
  const handleToggleVisibility = async (id: string, currentVisibility: 'private' | 'public') => {
    try {
      const nextVis = currentVisibility === 'private' ? 'public' : 'private';
      const response = await fetch("/api/prompts/toggle-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, visibility: nextVis })
      });

      if (response.ok) {
        const data = await response.json();
        const visMessage = nextVis === "public"
          ? "🔓 Published! Prompt is now Public to the organization."
          : "🔒 Restricted! Prompt is now Private to you.";
        showToast(visMessage);
        
        // Record publish event
        if (nextVis === "public") {
          fetch("/api/prompts/record-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, eventType: "publish" })
          });
        }
        
        fetchPromptsData();
      }
    } catch (error) {
      console.error("Error setting visibility", error);
    }
  };

  // Copy Action
  const handleCopyAction = async (p: HydratedPrompt, substitutedContent?: string) => {
    const textToCopy = substitutedContent || p.blocks.map(b => b.content).join("\n\n");
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast("📋 Copied raw prompt text to Clipboard!");
      
      // Update counts via backend usage_events
      await fetch("/api/prompts/record-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, eventType: "copy" })
      });
      fetchPromptsData();
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // Use Template action: Substitute {var} for [var], then copy
  const handleUseTemplate = async (p: HydratedPrompt, substitutedContent?: string) => {
    let content = substitutedContent;
    if (!content) {
      content = p.blocks.map(b => b.content).join("\n\n");
      // Replace unused variables with fallback
      p.variables.forEach(v => {
        content = content!.replace(new RegExp(`\\{${v.name}\\}`, 'g'), `[${v.name}]`);
      });
    }

    try {
      await navigator.clipboard.writeText(content);
      showToast("🚀 Templated Prompt copied to clipboard! Paste directly in AI chat.");
      
      // Update usage events counts
      await fetch("/api/prompts/record-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, eventType: "use_template" })
      });
      fetchPromptsData();
    } catch (err) {
      console.error("Failed to copy template", err);
    }
  };

  return (
    <div className="flex bg-slate-100 min-h-screen text-slate-800 font-sans antialiased overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        user={currentUser}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header toolbar */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
          tools={tools}
          onOpenQuickSave={() => setIsQuickSaveOpen(true)}
          onResetFilters={resetFilters}
        />

        {/* Inner Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Prompts list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {prompts.length === 0 ? (
              <div id="empty-state" className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-slate-200 text-center space-y-3 shadow-xs">
                <AlertCircle className="w-10 h-10 text-slate-300" />
                <h4 className="font-semibold text-slate-700 text-sm">ไม่พบข้อมูล Prompt</h4>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  ไม่พบรายการ Prompt สะสมที่สอดคล้องกับตัวเลือกการสืบค้นของคุณ ลองเริ่มสร้างขึ้นใหม่ด้วยการกด <b className="text-purple-700">Quick Save</b>
                </p>
                <div className="pt-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  >
                    Clear Search & Filters
                  </button>
                </div>
              </div>
            ) : viewMode === 'card' ? (
              /* Grid Layout of prompt cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompts.map((p) => (
                  <PromptCard
                    key={p.id}
                    prompt={p}
                    isSelected={selectedPrompt?.id === p.id}
                    onSelect={() => setSelectedPrompt(p)}
                    onFavorite={() => handleToggleFavorite(p.id)}
                    onCopyAction={handleCopyAction}
                    onUseTemplate={handleUseTemplate}
                  />
                ))}
              </div>
            ) : (
              /* Table list layout */
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                      <th className="p-3">Title & Tool</th>
                      <th className="p-3 hidden sm:table-cell">Type</th>
                      <th className="p-3">Visibility</th>
                      <th className="p-3 hidden md:table-cell">Usage Info</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prompts.map((p) => {
                      const isSelected = selectedPrompt?.id === p.id;
                      return (
                        <tr 
                          key={p.id} 
                          id={`prompt-row-${p.id}`}
                          onClick={() => setSelectedPrompt(p)}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? "bg-purple-50/30 font-medium" : ""
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-bold text-slate-800 truncate max-w-[240px]">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                              {p.primary_tool && (
                                <span className="bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                                  {p.primary_tool.name}
                                </span>
                              )}
                              <span>By: {p.owner?.display_name || "PEA"}</span>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell capitalize text-slate-600">
                            {p.blocks[0]?.block_type || "User Prompt"}
                          </td>
                          <td className="p-3">
                            {p.visibility === "public" ? (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold border border-amber-200 uppercase">
                                Public
                              </span>
                            ) : (
                              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[9px] font-bold border border-purple-200 uppercase">
                                Private
                              </span>
                            )}
                          </td>
                          <td className="p-3 hidden md:table-cell text-slate-500 font-mono text-[10px]">
                            {p.usage_count} uses • {p.copy_count} copies
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex space-x-1">
                              <button
                                id={`btn-copy-tbl-${p.id}`}
                                onClick={() => handleCopyAction(p)}
                                className="p-1.5 bg-slate-100 rounded text-slate-600 hover:bg-purple-700 hover:text-white transition-all cursor-pointer"
                                title="Copy prompt text"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-use-tbl-${p.id}`}
                                onClick={() => handleUseTemplate(p)}
                                className="p-1.5 bg-slate-100 rounded text-slate-600 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                                title="Use Template (copy variables parsed)"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right hand drawer / split block representing DetailPanel */}
          <div className="w-96 xl:w-112 shrink-0 border-l border-slate-200 h-full bg-white hidden lg:block">
            <DetailPanel
              prompt={selectedPrompt}
              onClose={() => setSelectedPrompt(null)}
              onToggleVisibility={handleToggleVisibility}
              onFavorite={handleToggleFavorite}
              onCopyAction={handleCopyAction}
              onUseTemplate={handleUseTemplate}
            />
          </div>
        </div>
      </main>

      {/* Floating details pane for Mobile displays */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSelectedPrompt(null)}>
          <div className="absolute right-0 top-0 bottom-0 max-w-sm w-full bg-white z-50 flex shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <DetailPanel
              prompt={selectedPrompt}
              onClose={() => setSelectedPrompt(null)}
              onToggleVisibility={handleToggleVisibility}
              onFavorite={handleToggleFavorite}
              onCopyAction={handleCopyAction}
              onUseTemplate={handleUseTemplate}
            />
          </div>
        </div>
      )}

      {/* Quick save modal drawer */}
      <QuickSaveDrawer
        isOpen={isQuickSaveOpen}
        onClose={() => setIsQuickSaveOpen(false)}
        tools={tools}
        onSave={handleSavePrompt}
      />

      {/* Toast Feedbacks */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white rounded-lg p-3 shadow-2xl max-w-sm flex items-center space-x-2 text-xs transition-opacity duration-300"
        >
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="font-medium text-[11px] leading-tight">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

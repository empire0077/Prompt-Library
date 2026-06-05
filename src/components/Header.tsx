import React from "react";
import { Search, Plus, Grid, List, RotateCcw, HelpCircle } from "lucide-react";
import { DbTool } from "../types";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  sortOrder: string;
  setSortOrder: (sort: string) => void;
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
  tools: DbTool[];
  onOpenQuickSave: () => void;
  onResetFilters: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedTool,
  setSelectedTool,
  selectedType,
  setSelectedType,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  tools,
  onOpenQuickSave,
  onResetFilters
}: HeaderProps) {
  
  const promptTypes = [
    { value: "", label: "All Types" },
    { value: "user", label: "User Prompt" },
    { value: "system", label: "System Prompt" },
    { value: "instruction", label: "Instruction" },
    { value: "skill", label: "Skill" },
  ];

  const sortOptions = [
    { value: "recently_updated", label: "Recently Updated" },
    { value: "most_used", label: "Most Popular" },
    { value: "title", label: "Alphabetical (A-Z)" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 space-y-4">
      {/* Top row: Title, quick info, and trigger */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">Prompt Library</h2>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 uppercase">
              PEA Internal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            เครื่องมือสืบค้น จัดเก็บ และแชร์ Prompt ทางวิศวกรรมและการจัดการภายในองค์กรอย่างเป็นระบบ
          </p>
        </div>

        {/* Quick Save and View toggles */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* View Toggles */}
          <div className="bg-slate-100 p-0.5 rounded-md flex items-center border border-slate-200">
            <button
              id="btn-view-card"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-[4px] transition-all ${
                viewMode === 'card'
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[4px] transition-all ${
                viewMode === 'table'
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Quick save purple button */}
          <button
            id="btn-quick-save"
            onClick={onOpenQuickSave}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-md shadow-sm transition-all border border-purple-800 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Save</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Search + Filters bar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
        {/* Search bar */}
        <div className="xl:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="search-input"
            type="text"
            placeholder="ค้นหาชื่อผู้แต่ง, รายละเอียด, คำสำคัญใน Prompt, หรือ Tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-purple-500 rounded-md py-2 pl-9 pr-4 text-xs placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Dropdown Filters and Sort */}
        <div className="grid grid-cols-3 gap-2 xl:col-span-2">
          {/* Tool filter */}
          <select
            id="filter-tool"
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md py-2 px-3 text-xs focus:border-purple-500 outline-none cursor-pointer transition-colors"
          >
            <option value="">All AI Tools</option>
            {tools.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Prompt Type filter */}
          <select
            id="filter-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md py-2 px-3 text-xs focus:border-purple-500 outline-none cursor-pointer transition-colors"
          >
            {promptTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>

          {/* Sort order selection */}
          <select
            id="filter-sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md py-2 px-3 text-xs focus:border-purple-500 outline-none cursor-pointer transition-colors"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters badge overview */}
      {(searchQuery || selectedTool || selectedType) && (
        <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span>Active filters:</span>
            {searchQuery && (
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Search: "{searchQuery}"
              </span>
            )}
            {selectedTool && (
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                Tool: {selectedTool}
              </span>
            )}
            {selectedType && (
              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                Type: {selectedType}
              </span>
            )}
          </div>
          <button
            onClick={onResetFilters}
            className="text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1 uppercase text-[10px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </header>
  );
}

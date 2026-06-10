import React from 'react';
import { 
  Plus, Search, Globe, Lock, Star, ChevronRight, BookOpen, 
  Code, User, Edit3, Database, Tv, LogIn, LogOut, UserCheck
} from 'lucide-react';
import { User as UserType, PromptCategory, Tool } from '../types';
import LogoIcon from './LogoIcon';

interface SidebarProps {
  currentUser: UserType | null;
  categories: PromptCategory[];
  tools: Tool[];
  
  // States
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  selectedScope: string; // 'all' | 'public' | 'private' | 'favorites'
  setSelectedScope: (s: string) => void;
  
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  
  selectedTool: string | null;
  setSelectedTool: (t: string | null) => void;

  // Actions
  onAddPrompt: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Sidebar({
  currentUser,
  categories,
  tools,
  searchQuery,
  setSearchQuery,
  selectedScope,
  setSelectedScope,
  selectedCategory,
  setSelectedCategory,
  selectedTool,
  setSelectedTool,
  onAddPrompt,
  onSignIn,
  onSignOut
}: SidebarProps) {

  // Map database icon string keys to Lucide React component elements
  const renderCategoryIcon = (iconName: string | null) => {
    switch (iconName) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'edit':
        return <Edit3 className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'presentation':
        return <Tv className="w-4 h-4" />;
      case 'book-open':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div id="app-sidebar" className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen fixed top-0 left-0 z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon size={38} className="shrink-0" />
          <div>
            <h1 className="font-black text-sm tracking-tight leading-none outfit flex items-center gap-0.5">
              <span className="text-[#131024]">YOUR</span>
              <span className="text-[#7c3aed]">PROMPT</span>
              <span className="text-slate-800 font-semibold text-[10px]">LIBRARY</span>
            </h1>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1 block">
              Personal Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาโครงสร้างคำสั่ง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Add New Prompt Action */}
        {currentUser && (
          <button
            onClick={onAddPrompt}
            className="w-full flex items-center justify-center gap-2 pea-gradient text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 hover:scale-[1.01] active:scale-100 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>สร้าง Prompt ของคุณ</span>
          </button>
        )}

        {/* Main Filters: Scopes */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-2">
            หมวดการเข้าถึง (Scope)
          </span>
          
          <button
            onClick={() => setSelectedScope('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedScope === 'all'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span>ทั้งหมด</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </button>

          <button
            onClick={() => setSelectedScope('public')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedScope === 'public'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Public (คลังสาธารณะ)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                onSignIn();
                return;
              }
              setSelectedScope('private');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedScope === 'private'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            } ${!currentUser ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Private ({currentUser ? 'คลังส่วนตัวของคุณ' : 'คลังส่วนตัว'})</span>
            </div>
            {!currentUser && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                Member
              </span>
            )}
            {currentUser && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                onSignIn();
                return;
              }
              setSelectedScope('favorites');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedScope === 'favorites'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            } ${!currentUser ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span>รายการโปรดของคุณ</span>
            </div>
            {!currentUser && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                Member
              </span>
            )}
            {currentUser && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
          </button>
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              หมวดหมู่งานพนักงาน
            </span>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[9px] text-purple-600 hover:underline font-semibold"
              >
                ล้างตัวเลือก
              </button>
            )}
          </div>

          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-purple-55 bg-purple-100 text-purple-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left leading-tight truncate">
                  <span className={selectedCategory === cat.id ? 'text-purple-600 scale-105' : 'text-slate-400'}>
                    {renderCategoryIcon(cat.icon)}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </div>
                {selectedCategory === cat.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 ml-1"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              โมเดลเป้าหมาย (AI Models)
            </span>
            {selectedTool && (
              <button
                onClick={() => setSelectedTool(null)}
                className="text-[9px] text-purple-600 hover:underline font-semibold"
              >
                ล้างตัวเลือก
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 px-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                  selectedTool === tool.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Footer User Section */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {currentUser ? (
          <div>
            <div className="flex items-start gap-2.5 mb-3">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.display_name}
                  className="w-[52px] h-[52px] rounded-xl object-cover shrink-0 border border-purple-200 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-[52px] h-[52px] rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shrink-0 border border-purple-200 uppercase shadow-sm">
                  {currentUser.display_name.slice(0, 2)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <span className="font-semibold text-slate-800 text-xs truncate">
                    {currentUser.display_name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border bg-purple-100 text-purple-750 border-purple-200">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 leading-normal truncate font-medium">
                  {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : (currentUser.position || 'ผู้ใช้งาน')}
                </div>
                <div className="text-[8px] text-slate-400 leading-tight font-mono truncate mt-0.5">
                  {currentUser.email}
                </div>
              </div>
            </div>
            
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 hover:text-red-650 active:bg-slate-100 font-medium text-[10px] text-slate-500 py-1.5 px-3 rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
              ล็อกอินเพื่อมีส่วนร่วมในการแชร์ และส่องดูคลังคำสั่งส่วนบุคคล
            </p>
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 pea-gradient text-white font-semibold text-xs py-2 px-4 rounded-xl shadow transition-all hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>ลงชื่อเข้าใช้งาน</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

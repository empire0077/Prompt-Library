import React from 'react';
import { 
  Plus, Search, Globe, Lock, Star, ChevronRight, BookOpen, 
  Code, User, Edit3, Database, Tv, LogIn, LogOut, UserCheck,
  FileText, Briefcase, Cpu, TrendingUp, Palette, Shield, Server,
  Zap, Headphones, Coins, BarChart2, Settings, Mail, Phone, Calendar, Wrench
} from 'lucide-react';
import { User as UserType, PromptCategory, Tool, Prompt } from '../types';
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

  allPrompts?: Prompt[];

  // Dark Mode support
  darkMode: boolean;
  onToggleDarkMode: () => void;
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
  onSignOut,
  allPrompts = [],
  darkMode,
  onToggleDarkMode
}: SidebarProps) {

  // Map category to matching Lucide React component elements based on name keywords or icon column
  const renderCategoryIcon = (catName: string, iconName: string | null) => {
    const name = catName.toLowerCase();
    
    // First, try matching based on keywords in category name
    if (name.includes('โค้ด') || name.includes('code') || name.includes('พัฒนา') || name.includes('dev')) {
      return <Code className="w-4 h-4" />;
    }
    if (name.includes('ฐานข้อมูล') || name.includes('database') || name.includes('sql') || name.includes('data')) {
      return <Database className="w-4 h-4" />;
    }
    if (name.includes('ธุรการ') || name.includes('ทั่วไป') || name.includes('general') || name.includes('admin') || name.includes('จัดการ') || name.includes('งาน')) {
      // Avoid matching other specific keywords unless generic
      if (!name.includes('เอกสาร') && !name.includes('วิเคราะห์') && !name.includes('การเงิน') && !name.includes('บัญชี') && !name.includes('ความปลอดภัย') && !name.includes('ระบบ') && !name.includes('ไอที')) {
        return <Briefcase className="w-4 h-4" />;
      }
    }
    if (name.includes('วิศว') || name.includes('engineer') || name.includes('ไฟฟ้า') || name.includes('pea')) {
      return <Cpu className="w-4 h-4" />;
    }
    if (name.includes('เอกสาร') || name.includes('รายงาน') || name.includes('doc') || name.includes('writer') || name.includes('เนื้อหา')) {
      return <FileText className="w-4 h-4" />;
    }
    if (name.includes('วิเคราะห์') || name.includes('สถิติ') || name.includes('chart') || name.includes('analytics')) {
      return <BarChart2 className="w-4 h-4" />;
    }
    if (name.includes('ความปลอดภัย') || name.includes('security') || name.includes('ตรวจสอบ') || name.includes('audit')) {
      return <Shield className="w-4 h-4" />;
    }
    if (name.includes('ระบบ') || name.includes('server') || name.includes('it') || name.includes('ไอที') || name.includes('เครือข่าย') || name.includes('เน็ต')) {
      return <Server className="w-4 h-4" />;
    }
    if (name.includes('อัตโนมัติ') || name.includes('automation') || name.includes('บอท') || name.includes('bot') || name.includes('zap') || name.includes('workflow')) {
      return <Zap className="w-4 h-4" />;
    }
    if (name.includes('บริการ') || name.includes('ลูกค้า') || name.includes('support') || name.includes('สิทธิ์') || name.includes('ช่วยเหลือ')) {
      return <Headphones className="w-4 h-4" />;
    }
    if (name.includes('การเงิน') || name.includes('บัญชี') || name.includes('เงิน') || name.includes('finance') || name.includes('budget')) {
      return <Coins className="w-4 h-4" />;
    }
    if (name.includes('ออกแบบ') || name.includes('ดีไซน์') || name.includes('design') || name.includes('สร้างสรรค์') || name.includes('ศิลปะ') || name.includes('ภาพ')) {
      return <Palette className="w-4 h-4" />;
    }
    if (name.includes('ตลาด') || name.includes('ขาย') || name.includes('โฆษณา') || name.includes('marketing') || name.includes('sales')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (name.includes('สไลด์') || name.includes('นำเสนอ') || name.includes('presentation') || name.includes('slide') || name.includes('ประชุม')) {
      return <Tv className="w-4 h-4" />;
    }
    if (name.includes('เรียน') || name.includes('ศึกษา') || name.includes('อบรม') || name.includes('knowledge') || name.includes('know')) {
      return <BookOpen className="w-4 h-4" />;
    }
    if (name.includes('บุคคล') || name.includes('human') || name.includes('resource') || name.includes('hr') || name.includes('คน')) {
      return <User className="w-4 h-4" />;
    }

    // Default to matching string-based icon if provided
    switch (iconName) {
      case 'user':
      case 'users':
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

  // Count how many prompts belong to each category
  const countByCat = (catId: string) => {
    return allPrompts.filter(p => p.category_id === catId).length;
  };

  // Sort categories by prompt count descending
  const sortedCategories = [...categories].sort((a, b) => {
    const countA = countByCat(a.id);
    const countB = countByCat(b.id);
    return countB - countA;
  });

  return (
    <div id="app-sidebar" className="w-80 shrink-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed top-0 left-0 z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon size={38} className="shrink-0" />
          <div>
            <h1 className="font-black text-sm tracking-tight leading-none outfit flex items-center gap-0.5">
              <span className="text-[#131024] dark:text-white">YOUR</span>
              <span className="text-[#7c3aed] dark:text-purple-400">PROMPT</span>
              <span className="text-slate-800 dark:text-slate-400 font-semibold text-[10px]">LIBRARY</span>
            </h1>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mt-1 block">
              Personal Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-550" />
          <input
            type="text"
            placeholder="ค้นหาโครงสร้างคำสั่ง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-955 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder-slate-400 text-slate-705 dark:text-slate-200"
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
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 block mb-2">
            หมวดการเข้าถึง (Scope)
          </span>
          
          <button
            onClick={() => setSelectedScope('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedScope === 'all'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-450 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>ทั้งหมด</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </button>

          <button
            onClick={() => setSelectedScope('public')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedScope === 'public'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-455 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Public (คลังสาธารณะ)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
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
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-455 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${!currentUser ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>Private ({currentUser ? 'คลังส่วนตัวของคุณ' : 'คลังส่วนตัว'})</span>
            </div>
            {!currentUser && (
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                Member
              </span>
            )}
            {currentUser && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
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
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-455 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${!currentUser ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span>รายการโปรดของคุณ</span>
            </div>
            {!currentUser && (
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                Member
              </span>
            )}
            {currentUser && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
          </button>
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              หมวดหมู่งานพนักงาน
            </span>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                ล้างตัวเลือก
              </button>
            )}
          </div>

          <div className="space-y-1">
            {sortedCategories.map((cat) => {
              const count = countByCat(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left leading-tight truncate mr-2">
                    <span className={selectedCategory === cat.id ? 'text-purple-600 dark:text-purple-400 scale-105' : 'text-slate-400 dark:text-slate-500'}>
                      {renderCategoryIcon(cat.name, cat.icon)}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight ${
                      selectedCategory === cat.id
                        ? 'bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-100 border border-purple-300/30'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/60'
                    }`}>
                      {count}
                    </span>
                    {selectedCategory === cat.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-405 shrink-0"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              โมเดลเป้าหมาย (AI Models)
            </span>
            {selectedTool && (
              <button
                onClick={() => setSelectedTool(null)}
                className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
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
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                  selectedTool === tool.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Footer User Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        {currentUser ? (
          <div>
            <div className="flex items-start gap-2.5 mb-3">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.display_name}
                  className="w-[52px] h-[52px] rounded-xl object-cover shrink-0 border border-purple-200 dark:border-purple-800 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-[52px] h-[52px] rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-750 dark:text-purple-300 flex items-center justify-center font-bold text-base shrink-0 border border-purple-200 dark:border-purple-800 uppercase shadow-sm">
                  {currentUser.display_name.slice(0, 2)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                    {currentUser.display_name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border bg-purple-100 dark:bg-purple-955 text-purple-750 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal truncate font-medium">
                  {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : (currentUser.position || 'ผู้ใช้งาน')}
                </div>
                <div className="text-[8px] text-slate-400 dark:text-slate-500 leading-tight font-mono truncate mt-0.5">
                  {currentUser.email}
                </div>
              </div>
            </div>
            
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-red-650 dark:hover:text-red-400 active:bg-slate-100 dark:active:bg-slate-800 font-medium text-[10px] text-slate-500 dark:text-slate-400 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 leading-relaxed">
              ล็อกอินเพื่อมีส่วนร่วมในการแชร์ และส่องดูคลังคำสั่งส่วนบุคคล
            </p>
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 pea-gradient text-white font-semibold text-xs py-2 px-4 rounded-xl shadow transition-all hover:-translate-y-0.5 cursor-pointer"
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

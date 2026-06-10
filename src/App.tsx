import React, { useEffect, useState } from 'react';
import { 
  Globe, Lock, Star, Sparkles, Filter, Database, 
  Trash2, Terminal, RefreshCw, AlertCircle, Bookmark, Compass
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import LogoIcon from './components/LogoIcon';
import PromptCard from './components/PromptCard';
import UseTemplateModal from './components/UseTemplateModal';
import PromptModal from './components/PromptModal';
import SignInModal from './components/SignInModal';
import { User, Prompt, PromptCategory, Tool } from './types';

export default function App() {
  // Authentication & Session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Master data collections
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [unfilteredPrompts, setUnfilteredPrompts] = useState<Prompt[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('all'); // 'all', 'public', 'private', 'favorites'
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [promptLoading, setPromptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Visibility controls
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isUseTemplateOpen, setIsUseTemplateOpen] = useState(false);
  const [activeUsePrompt, setActiveUsePrompt] = useState<Prompt | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [activeEditPrompt, setActiveEditPrompt] = useState<Prompt | null>(null);

  // Master data loading helper
  const loadMasterData = async () => {
    try {
      const [catsRes, toolsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tools')
      ]);

      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
      }
      if (toolsRes.ok) {
        const toolsData = await toolsRes.json();
        setTools(toolsData);
      }
    } catch (err) {
      console.error('Failed to load categories/tools master data', err);
      setError('ไม่สามารถโหลดข้อมูลจัดกลุ่มงานและเครื่องมือเป้าหมายได้');
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial mounting and user auth validation
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Session authentication failed/or empty proxy', err);
      }
    };

    checkSession();
    loadMasterData();
  }, []);

  // 2. Load Prompts list based on filters/permissions
  const fetchPromptsData = async () => {
    setPromptLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery);
      if (selectedScope) params.append('scope', selectedScope);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedTool) params.append('tool_id', selectedTool);

      const response = await fetch(`/api/prompts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('เรียกรายการคำสั่งในคลัง AI ล้มเหลว');
      }
      const data = await response.json();
      setPrompts(data);

      // Fetch unfiltered scope prompts to preserve global telemetry count accurately
      const unfilteredRes = await fetch('/api/prompts?scope=all');
      if (unfilteredRes.ok) {
        const unfilteredData = await unfilteredRes.json();
        setUnfilteredPrompts(unfilteredData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่ง');
    } finally {
      setPromptLoading(false);
    }
  };

  useEffect(() => {
    fetchPromptsData();
  }, [searchQuery, selectedScope, selectedCategory, selectedTool, currentUser]);

  const handleSignInSuccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        fetchPromptsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setCurrentUser(null);
      setSelectedScope('all');
      setSelectedCategory(null);
      setSelectedTool(null);
      fetchPromptsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/prompts/${id}/favorite`, { method: 'POST' });
      if (res.ok) {
        // Optimistic update of favorite state
        setPrompts(prev => prev.map(p => {
          if (p.id === id) {
            const isFav = !p.is_favorited;
            return {
              ...p,
              is_favorited: isFav,
              favorite_count: isFav ? (p.favorite_count || 0) + 1 : Math.max(0, (p.favorite_count || 1) - 1)
            };
          }
          return p;
        }));
        setUnfilteredPrompts(prev => prev.map(p => {
          if (p.id === id) {
            const isFav = !p.is_favorited;
            return {
              ...p,
              is_favorited: isFav,
              favorite_count: isFav ? (p.favorite_count || 0) + 1 : Math.max(0, (p.favorite_count || 1) - 1)
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle favorite status', err);
    }
  };

  const handleDeletePrompt = async (promptDelete: Prompt) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่ง "${promptDelete.title}" ออกจากคลัง AI?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/prompts/${promptDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedCategory(null);
        fetchPromptsData();
      } else {
        const data = await res.json();
        alert(data.error || 'ลบข้อมูลคำสั่งล้มเหลว');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูลคำสั่ง');
    }
  };

  const handleUseTemplate = (promptUse: Prompt) => {
    setActiveUsePrompt(promptUse);
    setIsUseTemplateOpen(true);
  };

  const handleEditPrompt = (promptEdit: Prompt) => {
    setActiveEditPrompt(promptEdit);
    setIsPromptOpen(true);
  };

  const handleAddPromptClick = () => {
    setActiveEditPrompt(null);
    setIsPromptOpen(true);
  };

  // Compute stat counters for quick informational bento-cards at top
  const statsSource = unfilteredPrompts.length > 0 ? unfilteredPrompts : prompts;
  const countStats = {
    total: statsSource.length,
    public: statsSource.filter(p => p.visibility === 'public').length,
    private: statsSource.filter(p => p.visibility === 'private').length,
    favorites: statsSource.filter(p => p.is_favorited).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 gap-4">
        {/* Render 100% authentic Logo with full typography underneath */}
        <LogoIcon size={120} withText={true} className="animate-pulse mb-2" />
        
        <div className="flex items-center gap-2 mt-2">
          <svg className="animate-spin h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-slate-500 font-semibold tracking-wide">กำลังเตรียมพอร์ทัล Your Prompt...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - fixed and standalone navigation Filter Panel */}
      <Sidebar
        currentUser={currentUser}
        categories={categories}
        tools={tools}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedScope={selectedScope}
        setSelectedScope={setSelectedScope}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        onAddPrompt={handleAddPromptClick}
        onSignIn={() => setIsSignInOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Panel Area - shifted right with generous elegant padding to stand parallel with sidebar */}
      <main className="flex-1 min-w-0 bg-slate-50 min-h-screen p-8 lg:p-12 pl-[352px] lg:pl-[384px] flex flex-col">
        {/* Core Header Banner with stats metrics */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-widest block mb-1">
              Your AI Prompt Portal & Personal Workspace
            </span>
            <h2 className="text-2xl font-black tracking-tight leading-none outfit flex items-center gap-1.5">
              <span className="text-[#131024]">YOUR</span>
              <span className="text-[#7c3aed]">PROMPT</span>
              <span className="text-slate-805 font-semibold text-lg ml-0.5">LIBRARY</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              ศูนย์รวมและจัดเก็บโครงร่างคำสั่ง AI ส่วนบุคคลอย่างสร้างสรรค์ ตรวจทาน รวบรวม และประยุกต์ใช้เพื่อเพิ่มประสิทธิภาพการทำงานสูงสุด
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchPromptsData()}
              title="ดึงข้อมูลอัปเดต"
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${promptLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Informational Stats Bento Grid Row */}
        {currentUser && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Card 1: All prompts */}
            <button
              onClick={() => setSelectedScope('all')}
              className={`p-4 rounded-2xl border text-left relative overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer outline-none select-none group ${
                selectedScope === 'all'
                  ? 'border-purple-300 bg-purple-50/40 shadow-sm ring-1 ring-purple-500/10'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">คำสั่งที่ประมวลผลได้</span>
              <div className="text-2xl font-black tracking-tight leading-none flex items-baseline gap-1.5">
                <span className={selectedScope === 'all' ? 'text-purple-700 font-extrabold' : 'text-slate-800'}>
                  {countStats.total}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">คำสั่งทั้งหมด</span>
              </div>
              <div className={`absolute top-0 right-0 h-1 transition-all duration-300 ${
                selectedScope === 'all' ? 'w-full bg-purple-600' : 'w-12 bg-purple-500/15'
              }`}></div>
            </button>

            {/* Card 2: Public prompts */}
            <button
              onClick={() => setSelectedScope('public')}
              className={`p-4 rounded-2xl border text-left relative overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer outline-none select-none group ${
                selectedScope === 'public'
                  ? 'border-emerald-300 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/10'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Public (แชร์ร่วม)</span>
              <div className="text-2xl font-black tracking-tight leading-none flex items-baseline gap-1.5">
                <span className="text-emerald-600">
                  {countStats.public}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">คำสั่งสาธารณะ</span>
              </div>
              <div className={`absolute top-0 right-0 h-1 transition-all duration-300 ${
                selectedScope === 'public' ? 'w-full bg-emerald-500' : 'w-12 bg-emerald-500/15'
              }`}></div>
            </button>

            {/* Card 3: Private prompts */}
            <button
              onClick={() => setSelectedScope('private')}
              className={`p-4 rounded-2xl border text-left relative overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer outline-none select-none group ${
                selectedScope === 'private'
                  ? 'border-amber-300 bg-amber-50/40 shadow-sm ring-1 ring-amber-500/10'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Private (ความจุส่วนตัว)</span>
              <div className="text-2xl font-black tracking-tight leading-none flex items-baseline gap-1.5">
                <span className="text-amber-500">
                  {countStats.private}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">คำสั่งส่วนตัว</span>
              </div>
              <div className={`absolute top-0 right-0 h-1 transition-all duration-300 ${
                selectedScope === 'private' ? 'w-full bg-amber-500' : 'w-12 bg-amber-500/15'
              }`}></div>
            </button>

            {/* Card 4: Favorites prompts */}
            <button
              onClick={() => setSelectedScope('favorites')}
              className={`p-4 rounded-2xl border text-left relative overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer outline-none select-none group ${
                selectedScope === 'favorites'
                  ? 'border-yellow-300 bg-yellow-50/20 shadow-sm ring-1 ring-yellow-500/10'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">รายการโปรด</span>
              <div className="text-2xl font-black tracking-tight leading-none flex items-baseline gap-1.5">
                <span className="text-amber-600">
                  {countStats.favorites}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">ชื่นชอบ</span>
              </div>
              <div className={`absolute top-0 right-0 h-1 transition-all duration-300 ${
                selectedScope === 'favorites' ? 'w-full bg-yellow-500' : 'w-12 bg-yellow-500/15'
              }`}></div>
            </button>
          </section>
        )}

        {/* Selected filters block tags feedback */}
        {(selectedCategory || selectedTool || selectedScope !== 'all') && (
          <div className="flex items-center flex-wrap gap-2 mb-6 text-xs bg-slate-100/60 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>ตัวกรองที่เลือก:</span>
            </div>

            {selectedScope !== 'all' && (
              <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[10px]">
                คลัง: <span className="uppercase">{selectedScope}</span>
                <button onClick={() => setSelectedScope('all')} className="hover:text-purple-900 font-black ml-1">×</button>
              </span>
            )}

            {selectedCategory && (
              <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[10px]">
                หมวด: {categories.find(c => c.id === selectedCategory)?.name || 'กำลังดึง...'}
                <button onClick={() => setSelectedCategory(null)} className="hover:text-purple-900 font-black ml-1">×</button>
              </span>
            )}

            {selectedTool && (
              <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[10px]">
                Target AI: {tools.find(t => t.id === selectedTool)?.name || 'กำลังดึง...'}
                <button onClick={() => setSelectedTool(null)} className="hover:text-purple-900 font-black ml-1">×</button>
              </span>
            )}
          </div>
        )}

        {/* Error Alert Display block */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex gap-2.5 mb-6 items-start font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-[10px] uppercase font-bold tracking-wide outline-none text-red-700 hover:underline"
              >
                เข้าใจและข้ามรอยนี้
              </button>
            </div>
          </div>
        )}

        {/* Main Grid View list of cards */}
        {promptLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-450 gap-3 border border-slate-100 border-dashed rounded-3xl bg-white">
            <svg className="animate-spin h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-semibold">กำลังกรองและประมวลผลคำสั่งทั้งหมด...</span>
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 gap-4 border border-slate-100 border-dashed bg-white rounded-3xl" style={{ minHeight: '18rem' }}>
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-350">
              <Compass className="w-6 h-6" />
            </div>
            <div className="text-center max-w-sm">
              <h4 className="font-bold text-slate-700 text-sm">ไม่พบข้อความโครงร่างคำสั่งในเงื่อนไขการหา</h4>
              <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
                กรุณาลองล้างตัวกรอง เปลี่ยนเงื่อนไขการกรอง หรือสร้างเอกสารคำสั่งตัวแทนของฝ่ายคุณขึ้นใช้งานร่วมกันได้ทันที
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                currentUser={currentUser}
                onUseTemplate={handleUseTemplate}
                onEditPrompt={handleEditPrompt}
                onDeletePrompt={handleDeletePrompt}
                onToggleFavorite={handleToggleFavorite}
                onTriggerSignIn={() => setIsSignInOpen(true)}
              />
            ))}
          </div>
        )}

        {/* Corporate Legal Footer */}
        <footer className="mt-auto pt-12 text-center text-[10px] text-slate-400 font-medium tracking-wide flex items-center justify-center gap-2 border-t border-slate-100">
          <span>⚡</span>
          <span>© 2026 Your Prompt Library Workspace</span>
          <span>•</span>
          <span>คลังจัดเก็บและพัฒนาชุดคำสั่งเพื่อเพิ่มประสิทธิภาพและเสถียรภาพในการทำงาน</span>
        </footer>

        {/* Floating Modals rendering panels */}
        <SignInModal
          isOpen={isSignInOpen}
          onClose={() => setIsSignInOpen(false)}
          onSuccess={handleSignInSuccess}
        />

        <UseTemplateModal
          prompt={activeUsePrompt}
          isOpen={isUseTemplateOpen}
          onClose={() => setIsUseTemplateOpen(false)}
        />

        <PromptModal
          isOpen={isPromptOpen}
          onClose={() => setIsPromptOpen(false)}
          prompt={activeEditPrompt}
          categories={categories}
          tools={tools}
          onSave={fetchPromptsData}
          onRefreshMasterData={loadMasterData}
        />
      </main>
    </div>
  );
}

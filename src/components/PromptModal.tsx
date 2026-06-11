import React, { useEffect, useState } from 'react';
import { Sparkles, HelpCircle, Save, Plus, Trash, Layers } from 'lucide-react';
import { Prompt, PromptCategory, Tool, PromptBlock, PromptVariable } from '../types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null; // Null if creating
  categories: PromptCategory[];
  tools: Tool[];
  onSave: () => void;
  onRefreshMasterData: () => Promise<void>;
}

export default function PromptModal({
  isOpen,
  onClose,
  prompt,
  categories,
  tools,
  onSave,
  onRefreshMasterData
}: PromptModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [primaryToolId, setPrimaryToolId] = useState('');
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Inner auxiliary states for custom creation
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submittingCat, setSubmittingCat] = useState(false);

  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [submittingTool, setSubmittingTool] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSubmittingCat(true);
    setError(null);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'สร้างหมวดหมู่ใหม่ล้มเหลว');
      }

      const createdCat = await response.json();
      await onRefreshMasterData();

      // Automatically select the freshly generated category
      setCategoryId(createdCat.id);
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่');
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleCreateTool = async () => {
    if (!newToolName.trim()) return;
    setSubmittingTool(true);
    setError(null);
    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newToolName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'สร้างโมเดล AI ล้มเหลว');
      }

      const createdTool = await response.json();
      await onRefreshMasterData();

      // Automatically select the newly created model
      setPrimaryToolId(createdTool.id);
      setIsAddingTool(false);
      setNewToolName('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเพิ่มโมเดล AI');
    } finally {
      setSubmittingTool(false);
    }
  };

  // Blocks & Variables sublists
  const [blocks, setBlocks] = useState<Partial<PromptBlock>[]>([
    { block_type: 'system', name: 'Role Directive', content: '', sort_order: 1 },
    { block_type: 'user', name: 'Task Loop', content: '', sort_order: 2 }
  ]);
  const [variables, setVariables] = useState<Partial<PromptVariable>[]>([
    { name: 'input_text', label: 'เนื้อหาขาเข้า', placeholder: 'พิมพ์ข้อมูลประสงค์ทดสอบที่นี่...', is_required: true, sort_order: 1 }
  ]);

  // Load existing prompt metadata on edit modal open
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    if (prompt) {
      setTitle(prompt.title || '');
      setDescription(prompt.description || '');
      setCategoryId(prompt.category_id || '');
      setPrimaryToolId(prompt.primary_tool_id || '');
      
      // Initialize selectedToolIds
      if (prompt.tool_ids) {
        setSelectedToolIds(prompt.tool_ids.split(',').map((s: string) => s.trim()).filter(Boolean));
      } else if (prompt.primary_tool_id) {
        setSelectedToolIds([prompt.primary_tool_id]);
      } else {
        setSelectedToolIds([]);
      }

      setVisibility(prompt.visibility || 'public');

      // Fetch categories sub-versions items
      setLoading(true);
      Promise.all([
        fetch(`/api/prompts/${prompt.id}/blocks`),
        fetch(`/api/prompts/${prompt.id}/variables`)
      ])
        .then(async ([blkRes, varRes]) => {
          if (blkRes.ok) {
            const blks = await blkRes.json();
            if (blks && blks.length > 0) setBlocks(blks);
          }
          if (varRes.ok) {
            const vars = await varRes.json();
            if (vars && vars.length > 0) setVariables(vars);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      // Clear for Create
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setPrimaryToolId(tools[0]?.id || '');
      setSelectedToolIds(tools[0]?.id ? [tools[0].id] : []);
      setVisibility('public');
      setBlocks([
        { block_type: 'system', name: 'Role Directive', content: 'คุณคือผู้เชี่ยวชาญ...', sort_order: 1 },
        { block_type: 'user', name: 'Task Loop', content: 'กรุณาวิเคราะห์ข้อความ: {input_text}', sort_order: 2 }
      ]);
      setVariables([
        { name: 'input_text', label: 'ข้อความเข้า', placeholder: 'เช่น บันทึกสรุปงาน...', is_required: true, sort_order: 1 }
      ]);
    }
  }, [isOpen, prompt, categories, tools]);

  if (!isOpen) return null;

  const handleAddBlock = () => {
    setBlocks(prev => [
      ...prev,
      { block_type: 'user', name: 'บล็อกใหม่', content: '', sort_order: prev.length + 1 }
    ]);
  };

  const handleRemoveBlock = (index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleBlockChange = (index: number, field: string, value: any) => {
    setBlocks(prev => prev.map((blk, i) => i === index ? { ...blk, [field]: value } : blk));
  };

  const handleAddVariable = () => {
    setVariables(prev => [
      ...prev,
      { name: 'variable_name', label: 'ป้ายตัวแปร', placeholder: '', is_required: true, sort_order: prev.length + 1 }
    ]);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariableChange = (index: number, field: string, value: any) => {
    setVariables(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('กรุณากรอกชื่อหัวข้อคำสั่งหลัก');
      return;
    }

    setLoading(true);
    const payload = {
      title,
      description,
      category_id: categoryId,
      primary_tool_id: selectedToolIds[0] || primaryToolId || null,
      tool_ids: selectedToolIds,
      visibility,
      blocks,
      variables
    };

    try {
      const url = prompt ? `/api/prompts/${prompt.id}` : '/api/prompts';
      const method = prompt ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'บันทึกคำสั่ง AI ล้มเหลว');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดทางเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="prompt-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div id="prompt-modal-container" className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-101 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {prompt ? 'แก้ไขข้อมูลโครงสร้างคำสั่ง AI' : 'สร้างและจัดเก็บคำสั่งใหม่ลงในคลังของคุณ'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
            style={{ width: '32px', height: '32px' }}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Column Split Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-150 dark:border-red-900/40 rounded-xl text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Metadata Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ชื่อหัวข้อโครงสร้างคำสั่ง (Title) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น [ฝ่ายจัดหา] สรุปหลักเกณฑ์การยื่นซองสอบ TOR..."
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">รายละเอียดคำอธิบาย (Description)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เช่น ใช้แปลงข้อมูลดิบของข้อตกลงเอกสารประกวดราคาที่มีพารามิเตอร์..."
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center h-5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">หมวดหมู่เป้าหมาย (Category)</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>เพิ่มหมวดหมู่ใหม่</span>
                </button>
              </div>
              
              {isAddingCategory ? (
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="ป้อนชื่อหมวดหมู่..."
                    className="flex-1 text-xs p-2 border border-purple-200 dark:border-purple-900 rounded-xl focus:ring-1 focus:ring-purple-500 focus:outline-none font-sans bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={submittingCat}
                    className="px-2.5 py-2 bg-purple-600 text-white text-[11px] font-bold rounded-lg hover:bg-purple-700 transition-all shrink-0 cursor-pointer"
                  >
                    {submittingCat ? '...' : 'เพิ่ม'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="px-2 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold rounded-lg transition-all shrink-0 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center h-5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">โมเดล AI ที่แนะนำ (AI Model Vendor)</label>
                <button
                  type="button"
                  onClick={() => setIsAddingTool(!isAddingTool)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>เพิ่มโมเดล AI ใหม่</span>
                </button>
              </div>

              {isAddingTool ? (
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    placeholder="ป้อนชื่อโมเดล..."
                    className="flex-1 text-xs p-2 border border-purple-200 dark:border-purple-900 rounded-xl focus:ring-1 focus:ring-purple-500/20 focus:outline-none font-sans bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateTool}
                    disabled={submittingTool}
                    className="px-2.5 py-2 bg-purple-600 text-white text-[11px] font-bold rounded-lg hover:bg-purple-700 transition-all shrink-0 cursor-pointer"
                  >
                    {submittingTool ? '...' : 'เพิ่ม'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTool(false);
                      setNewToolName('');
                    }}
                    className="px-2 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold rounded-lg transition-all shrink-0 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Selected badges list */}
                  {selectedToolIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-850 min-h-[38px] items-center">
                      {selectedToolIds.map((tid) => {
                        const tool = tools.find((t) => t.id === tid);
                        if (!tool) return null;
                        return (
                          <span
                            key={tid}
                            className="inline-flex items-center gap-1 px-2.5 base-badge py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-750 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50 transition-all"
                          >
                            <span>{tool.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedToolIds((prev) => prev.filter((id) => id !== tid))}
                              className="text-purple-400 hover:text-purple-600 font-bold transition-colors cursor-pointer shrink-0 ml-1"
                              title="ลบออก"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Select box block */}
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedToolIds.includes(val)) {
                        setSelectedToolIds((prev) => [...prev, val]);
                      }
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">-- เลือกโมเดล AI เพื่อแนะนำเพิ่มเติม --</option>
                    {tools.map((t) => (
                      <option key={t.id} value={t.id} disabled={selectedToolIds.includes(t.id)} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {t.name} {t.category ? `(${t.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">ขอบเขตการแชร์ใช้งาน (Visibility)</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="accent-purple-600 cursor-pointer"
                  />
                  <span>Public (เผยแพร่ให้พนักงานทุกคนใช้งาน)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="accent-purple-600 cursor-pointer"
                  />
                  <span>Private (ส่วนตัวสำหรับฉันคนเดียว)</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Instructions Code Blocks builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">โครงสร้างกล่องข้อความ (Prompt Code Blocks)</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-350 mt-0.5 leading-normal">ประกอบร่างคำสั่งด้วยโครงสีบล็อก (System และ User) เพื่อความเป็นสัดส่วน</p>
              </div>
              <button
                type="button"
                onClick={handleAddBlock}
                className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มบล็อก</span>
              </button>
            </div>

            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div key={idx} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 space-y-2 relative pl-6">
                  {/* Side strip colored tags */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl ${
                    block.block_type === 'system' ? 'bg-amber-200 dark:bg-amber-550' :
                    block.block_type === 'user' ? 'bg-blue-200 dark:bg-blue-550' :
                    block.block_type === 'instruction' ? 'bg-purple-200 dark:bg-purple-550' : 'bg-fuchsia-300'
                  }`}></div>

                  <div className="flex items-center gap-3">
                    <select
                      value={block.block_type}
                      onChange={(e) => handleBlockChange(idx, 'block_type', e.target.value)}
                      className="text-xs p-1 px-2 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 rounded font-bold uppercase transition-all dark:text-slate-200 cursor-pointer"
                    >
                      <option value="system" className="dark:bg-slate-900">System Block</option>
                      <option value="user" className="dark:bg-slate-900">User Block</option>
                      <option value="instruction" className="dark:bg-slate-900">Instruction Block</option>
                      <option value="skill" className="dark:bg-slate-900">Skill Block</option>
                    </select>

                    <input
                      type="text"
                      value={block.name || ''}
                      onChange={(e) => handleBlockChange(idx, 'name', e.target.value)}
                      placeholder="เช่น Role Directive..."
                      className="flex-1 text-xs p-1 px-3 border border-slate-200 dark:border-slate-800 rounded font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
                    />

                    {blocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(idx)}
                        className="p-1 px-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded border border-red-100 dark:border-red-900/40 hover:bg-red-100 text-[10px] font-bold cursor-pointer"
                      >
                        ลบ
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={block.content || ''}
                    onChange={(e) => handleBlockChange(idx, 'content', e.target.value)}
                    placeholder="กรุณาป้อนข้อกำหนด และสามารถแทรก {ตัวแปร} เพื่อรอให้ผู้ใช้คีย์ช่องสวมเข้า..."
                    className="w-full text-xs p-3 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 3: Variables Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">ตัวแปรสอดช่อง (Template Variables)</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-350 mt-0.5 leading-normal">ใส่ตัวแปรที่คุณเขียนครอบวงเล็บปีกกาข้างบน เพื่อให้ระบบสร้างแบบฟอร์มคีย์ข้อมูลป้อนใหม่อัตโนมัติ</p>
              </div>
              <button
                type="button"
                onClick={handleAddVariable}
                className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มพารามิเตอร์ตัวแปร</span>
              </button>
            </div>

            {variables.length === 0 ? (
              <div className="text-center py-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 border-dashed rounded-xl text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
                ไม่มีตัวแปรเสริม (คำสั่งของท่านเป็นแบบเทมเพลตนิ่งสมบูรณ์)
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4">
                {variables.map((v, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 relative bg-white dark:bg-slate-950/10">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold">#{idx + 1}</span>
                        <input
                          type="text"
                          value={v.name || ''}
                          onChange={(e) => handleVariableChange(idx, 'name', e.target.value.replaceAll(/[^a-zA-Z0-9_]/g, ''))}
                          placeholder="ชื่อตัวเลือกระบบ เช่น raw_text"
                          className="text-xs p-0.5 border-b border-purple-200 dark:border-purple-900 font-bold font-mono text-purple-650 dark:text-purple-450 focus:outline-none bg-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(idx)}
                        className="p-1 hover:text-red-500 rounded transition-all text-slate-400 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-450">ป้ายแสดง (Label)</span>
                        <input
                          type="text"
                          value={v.label || ''}
                          onChange={(e) => handleVariableChange(idx, 'label', e.target.value)}
                          placeholder="ป้ายชื่อช่องกรอก..."
                          className="w-full text-xs p-1 border border-slate-150 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">คำใบ้ (Placeholder)</span>
                        <input
                          type="text"
                          value={v.placeholder || ''}
                          onChange={(e) => handleVariableChange(idx, 'placeholder', e.target.value)}
                          placeholder="คำใบ้..."
                          className="w-full text-xs p-1 border border-slate-150 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!v.is_required}
                          onChange={(e) => handleVariableChange(idx, 'is_required', e.target.checked)}
                          className="accent-purple-600 rounded cursor-pointer"
                        />
                        <span>จำเป็นต้องกรอกพารามิเตอร์นี้</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer actions bar */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
            โครงสร้างข้อมูลได้รับการปกป้องและรองรับการเก็บ Caching เพื่อความรวดเร็วและปลอดภัย
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-lg text-xs transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 py-2 px-5 font-bold text-white shadow-md rounded-xl pea-gradient hover:opacity-95 text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{prompt ? 'อัปเดตคำสั่ง' : 'บันทึกคำสั่งขึ้นชั้นคลัง AI'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

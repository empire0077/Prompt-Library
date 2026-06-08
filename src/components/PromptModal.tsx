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
}

export default function PromptModal({
  isOpen,
  onClose,
  prompt,
  categories,
  tools,
  onSave
}: PromptModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [primaryToolId, setPrimaryToolId] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

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
      primary_tool_id: primaryToolId,
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
    <div id="prompt-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div id="prompt-modal-container" className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-slate-800 text-sm">
              {prompt ? 'แก้ไขข้อมูลโครงสร้างคำสั่ง AI' : 'สร้างและจัดเก็บคำสั่งใหม่ลงในคลังของคุณ'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
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
            <div className="p-3 bg-red-50 text-red-600 border border-red-150 rounded-xl text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Metadata Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">ชื่อหัวข้อโครงสร้างคำสั่ง (Title) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น [ฝ่ายจัดหา] สรุปหลักเกณฑ์การยื่นซองสอบ TOR..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">รายละเอียดคำอธิบาย (Description)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เช่น ใช้แปลงข้อมูลดิบของข้อตกลงเอกสารประกวดราคาที่มีพารามิเตอร์..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">หมวดหมู่เป้าหมาย (Category)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">โมเดล AI ที่แนะนำ (AI Model Vendor)</label>
              <select
                value={primaryToolId}
                onChange={(e) => setPrimaryToolId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans bg-white"
              >
                {tools.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category || ''})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">ขอบเขตการแชร์ใช้งาน (Visibility)</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
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
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
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

          <hr className="border-slate-100" />

          {/* Section 2: Instructions Code Blocks builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">โครงสร้างกล่องข้อความ (Prompt Code Blocks)</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">ประกอบร่างคำสั่งด้วยโครงสีบล็อก (System และ User) เพื่อความเป็นสัดส่วน</p>
              </div>
              <button
                type="button"
                onClick={handleAddBlock}
                className="flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มบล็อก</span>
              </button>
            </div>

            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 relative pl-6">
                  {/* Side strip colored tags */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl ${
                    block.block_type === 'system' ? 'bg-amber-200' : 'bg-blue-200'
                  }`}></div>

                  <div className="flex items-center gap-3">
                    <select
                      value={block.block_type}
                      onChange={(e) => handleBlockChange(idx, 'block_type', e.target.value)}
                      className="text-xs p-1 px-2 border border-slate-250 bg-white rounded font-bold uppercase transition-all"
                    >
                      <option value="system">System Block</option>
                      <option value="user">User Block</option>
                      <option value="instruction">Instruction Block</option>
                    </select>

                    <input
                      type="text"
                      value={block.name || ''}
                      onChange={(e) => handleBlockChange(idx, 'name', e.target.value)}
                      placeholder="เช่น Role Directive..."
                      className="flex-1 text-xs p-1 px-3 border border-slate-200 rounded font-bold"
                    />

                    {blocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(idx)}
                        className="p-1 px-2 bg-red-50 text-red-500 rounded border border-red-100 hover:bg-red-100 text-[10px] font-bold"
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
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Variables Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">ตัวแปรสอดช่อง (Template Variables)</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">ใส่ตัวแปรที่คุณเขียนครอบวงเล็บปีกกาข้างบน เพื่อให้ระบบสร้างแบบฟอร์มคีย์ข้อมูลป้อนใหม่อัตโนมัติ</p>
              </div>
              <button
                type="button"
                onClick={handleAddVariable}
                className="flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มพารามิเตอร์ตัวแปร</span>
              </button>
            </div>

            {variables.length === 0 ? (
              <div className="text-center py-4 bg-slate-50 border border-slate-100 border-dashed rounded-xl text-slate-400 font-semibold text-[11px]">
                ไม่มีตัวแปรเสริม (คำสั่งของท่านเป็นแบบเทมเพลตนิ่งสมบูรณ์)
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4">
                {variables.map((v, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-xl space-y-2 relative bg-white">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                        <input
                          type="text"
                          value={v.name || ''}
                          onChange={(e) => handleVariableChange(idx, 'name', e.target.value.replaceAll(/[^a-zA-Z0-9_]/g, ''))}
                          placeholder="ชื่อตัวเลือกระบบ เช่น raw_text"
                          className="text-xs p-0.5 border-b border-purple-200 font-bold font-mono text-purple-650 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(idx)}
                        className="p-1 hover:text-red-500 rounded transition-all text-slate-400"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500">ป้ายแสดง (Label)</span>
                        <input
                          type="text"
                          value={v.label || ''}
                          onChange={(e) => handleVariableChange(idx, 'label', e.target.value)}
                          placeholder="ป้ายชื่อช่องกรอก..."
                          className="w-full text-xs p-1 border border-slate-150 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500">คำใบ้ (Placeholder)</span>
                        <input
                          type="text"
                          value={v.placeholder || ''}
                          onChange={(e) => handleVariableChange(idx, 'placeholder', e.target.value)}
                          placeholder="คำใบ้..."
                          className="w-full text-xs p-1 border border-slate-150 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-[10px] text-slate-500 font-medium flex items-center gap-1 cursor-pointer select-none">
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
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-[10px] text-slate-400 font-medium">
            โครงสร้างข้อมูลได้รับการปกป้องและรองรับการเก็บ Caching เพื่อความรวดเร็วและปลอดภัย
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-semibold rounded-lg text-xs transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 py-2 px-5 font-bold text-white shadow-md rounded-xl pea-gradient hover:opacity-95 text-xs transition-all disabled:opacity-50"
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

import React, { useEffect, useState } from 'react';
import { Play, Copy, Check, Info, FileText, ChevronRight, CornerDownRight } from 'lucide-react';
import { Prompt, PromptBlock, PromptVariable } from '../types';

interface UseTemplateModalProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UseTemplateModal({ prompt, isOpen, onClose }: UseTemplateModalProps) {
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Fetch prompt details (both versions + variables + blocks)
  useEffect(() => {
    if (!prompt || !isOpen) return;

    setLoading(true);
    setBlocks([]);
    setVariables([]);
    setValues({});
    setCopied(false);

    const loadTemplateData = async () => {
      try {
        const [blocksRes, variablesRes] = await Promise.all([
          fetch(`/api/prompts/${prompt.id}/blocks`),
          fetch(`/api/prompts/${prompt.id}/variables`)
        ]);

        if (blocksRes.ok) {
          const blocksData = await blocksRes.json();
          setBlocks(blocksData.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)));
        }

        if (variablesRes.ok) {
          const variablesData = await variablesRes.json();
          setVariables(variablesData.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)));
          
          // Seed defaults
          const initValues: Record<string, string> = {};
          variablesData.forEach((v: PromptVariable) => {
            initValues[v.name] = v.default_value || '';
          });
          setValues(initValues);
        }
      } catch (err) {
        console.error('Failed to load variables/blocks for prompt template', err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplateData();
  }, [prompt, isOpen]);

  if (!isOpen || !prompt) return null;

  const handleInputChange = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  // Compile final merged blocks and substitute variables
  const compilePrompt = (): string => {
    return blocks
      .map(block => {
        let text = block.content || '';
        // Substitute all {variable_name} keys
        variables.forEach(v => {
          const val = values[v.name] || `{${v.name}}`;
          // Simple regex escape replacing keys
          text = text.replaceAll(`{${v.name}}`, val);
        });
        return `// === [${block.name || block.block_type.toUpperCase()}] ===\n${text}`;
      })
      .join('\n\n');
  };

  const handleCopyCompiled = async () => {
    const finalTxt = compilePrompt();
    try {
      await navigator.clipboard.writeText(finalTxt);
      setCopied(true);

      // Post update to usages metrics
      fetch(`/api/prompts/${prompt.id}/use`, { method: 'POST' }).catch(err => console.error(err));
      prompt.usage_count = (prompt.usage_count || 0) + 1;

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy compiled prompt template', err);
    }
  };

  return (
    <div id="use-template-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div id="use-template-modal-container" className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800/80">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block mb-0.5">
              ระบบสวมเทมเพลตพร้อมใช้งาน (Prompt Composer)
            </span>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 truncate">
              {prompt.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            style={{ width: '32px', height: '32px' }}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Main Scroll Area Split */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-450 dark:text-slate-400 gap-3">
            <svg className="animate-spin h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium">กำลังโหลดแบบฟอร์มและตัวแปรคำสั่ง...</span>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Form Fields Variables Panel */}
            <div className="w-1/2 overflow-y-auto p-6 border-r border-slate-100 dark:border-slate-800 space-y-5 bg-white dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50 dark:border-slate-800">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-450" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  กรอกตัวแปรในวงเล็บปีกกา
                </h4>
              </div>

              {variables.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-455 dark:text-slate-400 leading-relaxed">
                  โครงสร้างคำสั่งนี้ไม่มีตัวแปรเสริม คุณสามารถสกัดและก๊อปปี้บล็อกสมบูรณ์พล็อตด่วนได้ทันทีที่แผงด้านข้าง
                </div>
              ) : (
                <div className="space-y-4">
                  {variables.map((variable) => (
                    <div key={variable.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <label className="text-slate-700 dark:text-slate-350 flex items-center gap-1.5 leading-tight">
                          <span>{variable.label || variable.name}</span>
                          {variable.is_required && (
                            <span className="text-red-500 text-[10px]">*</span>
                          )}
                        </label>
                        <span className="text-[9px] font-mono text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1 rounded">
                          {`{${variable.name}}`}
                        </span>
                      </div>
                      
                      {variable.description && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pb-0.5">
                          {variable.description}
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={values[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        placeholder={variable.placeholder || 'ระบุรายละเอียด...'}
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-sans dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-550"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Live Update Output Preview Panel */}
            <div className="w-1/2 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
              <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs text-left">คำสั่งที่เรียบเรียงสำเร็จ (Compiled Prompt)</span>
                </div>
                
                {prompt.tool_name && (
                  <span className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 py-0.5 px-2 rounded-md font-mono text-slate-500 dark:text-slate-400 font-bold">
                    Target: {prompt.tool_name}
                  </span>
                )}
              </div>

              {/* Dynamic code blocks visualization block */}
              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs text-slate-700 space-y-4">
                {blocks.map((block) => {
                  let renderedTxt = block.content || '';
                  variables.forEach(v => {
                    const provided = values[v.name];
                    const rep = provided ? `[${provided}]` : `{${v.name}}`;
                    renderedTxt = renderedTxt.replaceAll(`{${v.name}}`, rep);
                  });

                  return (
                    <div key={block.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left leading-relaxed relative pl-6 group">
                      {/* Left Block Line indicator tag */}
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl bg-purple-200 dark:bg-purple-900 group-hover:bg-purple-500 transition-all"></div>
                      
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider mb-2 select-none">
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span>{block.name || block.block_type}</span>
                      </div>
                      
                      <pre className="whitespace-pre-wrap font-mono text-[11px] font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                        {renderedTxt}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom control-bar block */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 text-xs">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-semibold leading-none text-left">
            <Info className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
            <span>กรอกเนื้อหาและกดปุ่มคัดลอกคำสั่งเพื่อไปรันต่อบนระบบ AI นอกได้ทันที</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 font-semibold rounded-lg transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCopyCompiled}
              disabled={loading}
              className={`flex items-center gap-1.5 py-2 px-5 font-bold text-white shadow-md transition-all rounded-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                copied 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
                  : 'pea-gradient hover:opacity-95 shadow-purple-500/10'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>คัดลอกโครงร่างสำเร็จแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกคำสั่งพร้อมใช้</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

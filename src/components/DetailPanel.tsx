import React, { useState, useEffect } from "react";
import { 
  X, 
  Copy, 
  Zap, 
  Lock, 
  Globe, 
  Clock, 
  User, 
  Cpu, 
  Check, 
  Globe2,
  Calendar,
  AlertCircle
} from "lucide-react";
import { HydratedPrompt, PromptVariable, PromptBlock } from "../types";

interface DetailPanelProps {
  prompt: HydratedPrompt | null;
  onClose: () => void;
  onToggleVisibility: (id: string, currentVisibility: 'private' | 'public') => void;
  onFavorite: (id: string) => void;
  onCopyAction: (p: HydratedPrompt, substitutedContent?: string) => void;
  onUseTemplate: (p: HydratedPrompt, substitutedContent?: string) => void;
}

export default function DetailPanel({
  prompt,
  onClose,
  onToggleVisibility,
  onFavorite,
  onCopyAction,
  onUseTemplate
}: DetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(false);
  const [variablesForm, setVariablesForm] = useState<Record<string, string>>({});

  // Reset variables whenever prompt changes
  useEffect(() => {
    if (prompt) {
      const initial: Record<string, string> = {};
      prompt.variables.forEach((v: PromptVariable) => {
        initial[v.name] = "";
      });
      setVariablesForm(initial);
    }
    setCopied(false);
    setUsed(false);
  }, [prompt]);

  if (!prompt) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50 border-l border-slate-200">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium">เลือก Prompt เพื่อตรวจสอบรายละเอียด</p>
        <p className="text-[11px] text-slate-400 max-w-sm mt-1">
          คลิกเลือกการ์ด Prompt ทางซ้ายมือ เพื่อตรวจสอบเนื้อหา ตัวแปรการกรอกข้อมูล และสถิติการใช้งาน
        </p>
      </div>
    );
  }

  // Get full combined text content from all blocks
  const getFullContent = () => {
    return prompt.blocks.map((b: PromptBlock) => b.content).join("\n\n");
  };

  const getSubstitutedContent = (useFallbackFormatInput = false) => {
    let text = getFullContent();
    prompt.variables.forEach((v: PromptVariable) => {
      const userVal = variablesForm[v.name];
      if (userVal && userVal.trim() !== "") {
        text = text.replace(new RegExp(`\\{${v.name}\\}`, 'g'), userVal);
      } else {
        if (useFallbackFormatInput) {
          text = text.replace(new RegExp(`\\{${v.name}\\}`, 'g'), `[${v.name}]`);
        }
      }
    });
    return text;
  };

  const handleCopy = () => {
    const finalContent = getSubstitutedContent();
    onCopyAction(prompt, finalContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseTemplate = () => {
    // Substitute unused variables with [variable]
    const finalContent = getSubstitutedContent(true);
    onUseTemplate(prompt, finalContent);
    setUsed(true);
    setTimeout(() => setUsed(false), 2000);
  };

  const handleVariableChange = (name: string, val: string) => {
    setVariablesForm(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div id="prompt-detail-panel" className="h-full flex flex-col bg-slate-50 border-l border-slate-200 overflow-hidden w-full max-w-md xl:max-w-lg sticky top-0">
      {/* Header Panel */}
      <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Prompt Inspector
          </span>
          <h3 className="font-semibold text-sm text-slate-800 truncate max-w-[280px] xl:max-w-[340px]">
            {prompt.title}
          </h3>
        </div>
        <button 
          id="btn-close-details"
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Core Metadata */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Visibility & Status</span>
            {prompt.visibility === "public" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">
                Public Organization
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase">
                Private Draft
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <div className="truncate">
                <span className="text-slate-400 font-normal">By: </span>
                <span className="font-semibold text-slate-700">{prompt.owner?.display_name || "PEA Staff"}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <span className="text-slate-400">Updated: </span>
                <span className="font-semibold text-slate-700">
                  {new Date(prompt.updated_at).toLocaleDateString("th-TH")}
                </span>
              </div>
            </div>

            {prompt.primary_tool && (
              <div className="flex items-center space-x-1.5 col-span-2">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <div>
                  <span className="text-slate-400">Suggested Tool: </span>
                  <span className="font-bold text-purple-800">{prompt.primary_tool.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Visibility toggle buttons */}
          <div className="pt-2">
            <button
              id={`btn-publish-toggle-${prompt.id}`}
              onClick={() => onToggleVisibility(prompt.id, prompt.visibility)}
              className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 font-medium rounded-md bg-slate-50 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              {prompt.visibility === "private" ? (
                <>
                  <Globe2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Publish to Organization (Make Public)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Revoke Access (Make Private)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Categories & Tags */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Description & Tags
          </span>
          <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
            {prompt.description || "ไม่มีคำอธิบายสำหรับ Prompt นี้"}
          </p>
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {prompt.tags.map((tag: any) => (
                <span key={tag.id} className="text-[10px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100 px-2.5 py-0.5 rounded-full">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Variables Fill Panel (if variables present) */}
        {prompt.variables && prompt.variables.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Prompt Variables ({prompt.variables.length})
            </span>
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
              <p className="text-[11px] text-slate-500 leading-relaxed border-b border-slate-100 pb-2">
                กรอกข้อมูลลงในฟิลด์เหล่านี้เพื่อแทนค่าตัวแปรใน Prompt โค้ดด้านล่างแบบอัตโนมัติ
              </p>
              {prompt.variables.map((variable: PromptVariable) => (
                <div key={variable.id} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                    <span>{variable.label || variable.name}</span>
                    <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1 py-0.2 rounded">
                      {"{"}{variable.name}{"}"}
                    </span>
                  </label>
                  <input
                    type="text"
                    id={`var-input-${variable.name}`}
                    value={variablesForm[variable.name] || ""}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    placeholder={variable.placeholder || `ป้อนค่าสำหรับ ${variable.name}...`}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-md py-1.5 px-3 text-xs outline-none transition-colors"
                  />
                  {variable.description && (
                    <span className="text-[10px] text-slate-400 italic block pl-1">
                      {variable.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code Content Block */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>PROMPT RAW CONTENT</span>
            <span className="text-[9px] font-mono font-medium text-slate-400 lowercase">
              {prompt.blocks.length} section(s)
            </span>
          </span>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative shadow">
            {/* Syntax bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] text-slate-500 font-mono ml-2">SYSTEM/USER BLOCK</span>
              </div>
            </div>

            {/* Displaying substituted code */}
            <div className="p-4 overflow-x-auto max-h-[300px] font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text bg-slate-900">
              {getSubstitutedContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer sticky Actions */}
      <div className="bg-white px-5 py-4 border-t border-slate-200 mt-auto grid grid-cols-2 gap-3 shadow-md relative">
        {/* Use template button */}
        <button
          id="btn-use-detail"
          onClick={handleUseTemplate}
          className={`cursor-pointer w-full py-2.5 px-4 text-xs font-bold border rounded-md transition-all inline-flex items-center justify-center space-x-2 ${
            used
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
          title="แทนค่าตัวแปร {x} ด้วย [x] แล้วคัดลอกลงคลิปบอร์ด"
        >
          <Zap className="w-4 h-4 text-purple-700" />
          <span>{used ? "คัดลอกเทมเพลตแล้ว!" : "Use Template"}</span>
        </button>

        {/* Copy Prompt (with substituted inputs) */}
        <button
          id="btn-copy-detail"
          onClick={handleCopy}
          className={`cursor-pointer w-full py-2.5 px-4 text-xs font-bold rounded-md transition-all inline-flex items-center justify-center space-x-2 ${
            copied
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-purple-700 hover:bg-purple-800 border-purple-800 text-white shadow-sm"
          }`}
          title="คัดลอก Prompt พร้อมข้อมูลที่กรอกในตัวแปร"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? "คัดลอกลงคลิปบอร์ดแล้ว!" : "Copy Prompt Text"}</span>
        </button>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { X, Send, AlertTriangle, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DbTool } from "../types";

interface QuickSaveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tools: DbTool[];
  onSave: (payload: {
    title: string;
    description: string;
    content: string;
    type: string;
    tool: string;
    visibility: 'private' | 'public';
    tags: string[];
  }) => Promise<void>;
}

export default function QuickSaveDrawer({
  isOpen,
  onClose,
  tools,
  onSave
}: QuickSaveDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("user");
  const [tool, setTool] = useState("chatgpt");
  const [visibility, setVisibility] = useState<'private' | 'public'>("private");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMess, setErrorMess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess("");

    if (!title.trim()) {
      setErrorMess("กรุณาระบุชื่อหัวข้อ Prompt (Title)");
      return;
    }
    if (!content.trim()) {
      setErrorMess("กรุณาระบุเนื้อหา Prompt (Content)");
      return;
    }

    try {
      setIsSubmitting(true);
      // Process tags
      const processedTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        title,
        description,
        content,
        type,
        tool,
        visibility,
        tags: processedTags
      });

      // Clear fields
      setTitle("");
      setDescription("");
      setContent("");
      setType("user");
      setTool("chatgpt");
      setVisibility("private");
      setTagsInput("");
      onClose();
    } catch (err) {
      setErrorMess("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col h-full border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-purple-50">
              <div>
                <h3 className="font-bold text-sm text-purple-900">Add New Prompt</h3>
                <p className="text-[10px] text-purple-700">จัดเก็บ Prompt คลังข้อมูลอัจฉริยะ PEA</p>
              </div>
              <button
                id="btn-close-quick-save"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white text-purple-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {errorMess && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-md border border-red-200 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMess}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  TITLE * <span className="text-slate-400 font-normal">(ชื่อหัวข้อการทำงาน)</span>
                </label>
                <input
                  type="text"
                  id="qs-input-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น [ฝ่ายบัญชี] ปรับปรุงสูตรค้นหาค่าใช้จ่ายคู่ค้า..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-md py-2 px-3 text-xs outline-none transition-colors"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  DESCRIPTION <span className="text-slate-400 font-normal">(คำอธิบายวัตถุประสงค์โดยสรุป)</span>
                </label>
                <textarea
                  id="qs-input-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น ใช้วิเคราะห์ประวัติการจ่ายไฟ หรือเขียนสคริปต์ Power BI..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-md py-2 px-3 text-xs outline-none transition-colors resize-none"
                />
              </div>

              {/* Content block */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex justify-between">
                  <span>PROMPT RAW CONTENT *</span>
                  <span className="text-[9px] text-purple-700 font-medium">รองรับตัวแปรแบบ {"{variable_name}"}</span>
                </label>
                <textarea
                  id="qs-input-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="ใส่บทคำสั่งสำหรับ AI ลงในช่องนี้...
ตัวอย่าง:
คุณคือ {role} ฝ่าย PEA
กรุณาเขียนสเปกสเปรดชีตวิเคราะห์ปริมาณงานไฟฟ้าของแผนก {department_name}..."
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-md py-2 px-3 text-xs font-mono outline-none transition-colors resize-y"
                  required
                />
              </div>

              {/* Type and suggested tool select */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">PROMPT TYPE</label>
                  <select
                    id="qs-select-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="user">User Prompt</option>
                    <option value="system">System Prompt</option>
                    <option value="instruction">Instruction</option>
                    <option value="skill">Skill</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">SUGGESTED TOOL</label>
                  <select
                    id="qs-select-tool"
                    value={tool}
                    onChange={(e) => setTool(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-2 text-xs outline-none cursor-pointer"
                  >
                    {tools.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visibility selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-700 block">VISIBILITY SETTING</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="qs-btn-vis-private"
                    onClick={() => setVisibility("private")}
                    className={`py-2 px-3 rounded-md text-xs font-semibold border flex items-center justify-center space-x-1.5 cursor-pointer ${
                      visibility === "private"
                        ? "bg-purple-100 text-purple-800 border-purple-400"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Private (งานของคุณเท่านั้น)</span>
                  </button>

                  <button
                    type="button"
                    id="qs-btn-vis-public"
                    onClick={() => setVisibility("public")}
                    className={`py-2 px-3 rounded-md text-xs font-semibold border flex items-center justify-center space-x-1.5 cursor-pointer ${
                      visibility === "public"
                        ? "bg-amber-100 text-amber-800 border-amber-400"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Public (ทุกคนในองค์กรเห็น)</span>
                  </button>
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  TAGS <span className="text-slate-400 font-normal">(คั่นแต่ละคำด้วยเครื่องหมายจุลภาค ,)</span>
                </label>
                <input
                  type="text"
                  id="qs-input-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="เช่น Engineering, Data Analysis, REPORT"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-md py-2 px-3 text-xs outline-none transition-colors"
                />
              </div>
            </form>

            {/* Footer triggers */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-md bg-white hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="qs-btn-submit"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 border border-purple-800 text-white text-xs font-bold rounded-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Quick Save</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

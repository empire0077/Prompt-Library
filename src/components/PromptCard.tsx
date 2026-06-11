import React, { useState } from 'react';
import { 
  Globe, Lock, Star, Copy, Zap, PenTool, Trash2, Check,
  Eye, FileText, Settings, Award, Pointer
} from 'lucide-react';
import { Prompt, User } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  currentUser: User | null;
  onUseTemplate: (p: Prompt) => void;
  onEditPrompt: (p: Prompt) => void;
  onDeletePrompt: (p: Prompt) => void;
  onToggleFavorite: (id: string) => void;
  onTriggerSignIn: () => void;
}

export default function PromptCard({
  prompt,
  currentUser,
  onUseTemplate,
  onEditPrompt,
  onDeletePrompt,
  onToggleFavorite,
  onTriggerSignIn
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  // Check permissions (either admin or owner of the prompt)
  const isAuthorizedToEdit = currentUser && (
    currentUser.role === 'admin' || currentUser.id === prompt.owner_user_id
  );

  const handleCopyRaw = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/prompts/${prompt.id}/raw`);
      if (!res.ok) throw new Error('Failed to get raw prompt template');
      const { rawContent } = await res.json();
      
      await navigator.clipboard.writeText(rawContent || '');
      setCopied(true);
      
      // Increment copy counts
      fetch(`/api/prompts/${prompt.id}/copy`, { method: 'POST' }).catch(err => console.error(err));
      prompt.copy_count = (prompt.copy_count || 0) + 1;

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onTriggerSignIn();
      return;
    }
    onToggleFavorite(prompt.id);
  };

  return (
    <div id={`prompt-card-${prompt.id}`} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-purple-200 dark:hover:border-purple-800/80 hover:shadow-lg dark:hover:shadow-purple-950/10 transition-all p-5 flex flex-col justify-between group relative overflow-hidden">
      
      {/* Visibility Corner Indicator Banner */}
      <div className="absolute top-0 right-0 h-1.5 w-16 bg-purple-500/10 dark:bg-purple-500/20"></div>
      
      <div>
        {/* Card Header metadata */}
        <div className="flex items-center justify-between text-[10px] mb-3">
          <div className="flex items-center gap-1.5 overflow-hidden pr-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-semibold border border-purple-100 dark:border-purple-900/50 truncate">
              {prompt.category_name || 'หมวดพนักงาน'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-850 truncate font-mono">
              {prompt.tool_name || 'โมเดลอิสระ'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {prompt.visibility === 'private' ? (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 font-semibold">
                <Lock className="w-3 h-3" />
                <span>ส่วนตัว</span>
              </span>
            ) : (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 font-semibold">
                <Globe className="w-3 h-3" />
                <span>สาธารณะ</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors mb-2 line-clamp-2">
          {prompt.title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4 line-clamp-3 font-normal" style={{ minHeight: '3.5rem' }}>
          {prompt.description || 'ไม่มีคำอธิบายสำหรับคำสั่งนี้'}
        </p>


      </div>

      <div>
        {/* Interaction Statistics Row */}
        <div className="flex items-center gap-3 border-t border-slate-50 dark:border-slate-800/80 pt-3.5 mb-4 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600" />
            <span>ใช้งาน {prompt.usage_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600" />
            <span>คัดลอก {prompt.copy_count || 0}</span>
          </div>
          
          <button 
            onClick={handleFavoriteClick}
            className="flex items-center gap-1 hover:text-amber-500 dark:hover:text-amber-400 group/fav transition-colors ml-auto cursor-pointer"
          >
            <Star className={`w-3.5 h-3.5 ${
              prompt.is_favorited 
                ? 'text-amber-400 fill-amber-400' 
                : 'text-slate-350 dark:text-slate-600 group-hover/fav:text-amber-400'
            }`} />
            <span>{prompt.favorite_count || 0}</span>
          </button>
        </div>

        {/* Dynamic Actions block */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => onUseTemplate(prompt)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 active:bg-purple-200 dark:active:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
          >
            <Pointer className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-purple-200" />
            <span>กดนำไปใช้งาน</span>
          </button>

          <button
            onClick={handleCopyRaw}
            title="คัดลอกโครงร่างคำสั่งด่วน"
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              copied 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-850' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4 mx-auto" />
            ) : (
              <Copy className="w-4 h-4 mx-auto" />
            )}
          </button>

          {isAuthorizedToEdit && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPrompt(prompt);
                }}
                title="แก้ไขข้อมูลคำสั่ง"
                className="p-2 text-slate-400 dark:text-slate-550 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePrompt(prompt);
                }}
                title="ลบคำสั่ง"
                className="p-2 text-slate-400 dark:text-slate-550 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

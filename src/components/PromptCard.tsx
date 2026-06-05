import React, { useState } from "react";
import { 
  Copy, 
  Settings, 
  Layers, 
  Star, 
  ExternalLink,
  ChevronRight,
  User,
  Zap,
  Check
} from "lucide-react";
import { motion } from "motion/react";
import { HydratedPrompt } from "../types";

interface PromptCardProps {
  key?: string | number | React.Key;
  prompt: HydratedPrompt;
  isSelected: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  onCopyAction: (p: HydratedPrompt, substitutedContent?: string) => void;
  onUseTemplate: (p: HydratedPrompt, substitutedContent?: string) => void;
}

export default function PromptCard({
  prompt,
  isSelected,
  onSelect,
  onFavorite,
  onCopyAction,
  onUseTemplate
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyAction(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUseTemplate(prompt);
    setUsed(true);
    setTimeout(() => setUsed(false), 2000);
  };

  // Select tool colors beautifully
  const getToolStyles = (slug?: string) => {
    switch (slug) {
      case "chatgpt":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "claude":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "gemini":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "notebooklm":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "codex":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  const getTagColorClass = (color?: string) => {
    switch (color) {
      case "purple": return "bg-purple-50 text-purple-700 border-purple-100";
      case "blue": return "bg-blue-50 text-blue-700 border-blue-100";
      case "amber": return "bg-amber-50 text-amber-700 border-amber-100";
      case "teal": return "bg-teal-50 text-teal-700 border-teal-100";
      case "indigo": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "cyan": return "bg-cyan-50 text-cyan-700 border-cyan-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <motion.div
      id={`prompt-card-${prompt.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`border rounded-lg p-4 bg-white transition-all duration-150 cursor-pointer flex flex-col justify-between relative shadow-sm hover:translate-y-[-2px] ${
        isSelected 
          ? "border-purple-600 bg-purple-50/20 ring-1 ring-purple-600" 
          : "border-slate-200 hover:border-slate-300 hover:shadow"
      }`}
    >
      <div className="space-y-3">
        {/* Top bar: Visibility status badge and tools indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            {prompt.visibility === "public" ? (
              <span id={`badge-public-${prompt.id}`} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">
                Public
              </span>
            ) : (
              <span id={`badge-private-${prompt.id}`} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase">
                Private
              </span>
            )}

            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200 capitalize">
              {prompt.blocks[0]?.block_type || "User Prompt"}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* Tool indicator */}
            {prompt.primary_tool && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getToolStyles(prompt.primary_tool.slug)}`}>
                {prompt.primary_tool.name}
              </span>
            )}
            
            {/* Favorite button */}
            <button
              id={`btn-fav-${prompt.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
              className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                prompt.is_favorite ? "text-amber-500" : "text-slate-300 hover:text-slate-400"
              }`}
              title="Add to Favorites"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2 hover:text-purple-800">
            {prompt.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {prompt.description}
          </p>
        </div>

        {/* Tags row */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <span 
                key={tag.id} 
                className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${getTagColorClass(tag.color)}`}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer bar: Metrics, author, and speedy triggers */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        {/* Owner & Metrics info */}
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-slate-400 flex items-center space-x-1">
            <User className="w-2.5 h-2.5" />
            <span className="truncate max-w-[90px] font-medium">{prompt.owner?.display_name || "PEA Admin"}</span>
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
            {prompt.usage_count} uses • {prompt.copy_count} copies
          </span>
        </div>

        {/* Small quick buttons */}
        <div className="flex items-center space-x-1">
          {/* Use Template button */}
          <button
            id={`btn-use-card-${prompt.id}`}
            onClick={handleUse}
            className={`cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-semibold border rounded transition-all ${
              used 
                ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
            }`}
            title="Replace variables {x} with [x] and copy to clipboard"
          >
            {used ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3 text-purple-600" />}
            <span>{used ? "Loaded!" : "Use"}</span>
          </button>

          {/* Copy Prompt button */}
          <button
            id={`btn-copy-card-${prompt.id}`}
            onClick={handleCopy}
            className={`cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-semibold border rounded transition-all ${
              copied 
                ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                : "bg-purple-700 hover:bg-purple-800 border-purple-800 text-white shadow-xs"
            }`}
            title="Copy prompt text as is"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Chevron details */}
          <button 
            id={`btn-details-${prompt.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            title="Open Details Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

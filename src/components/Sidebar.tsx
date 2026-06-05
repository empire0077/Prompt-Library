import React from "react";
import { 
  Layers, 
  Lock, 
  Globe, 
  Star, 
  BookOpen, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  BarChart2, 
  Presentation,
  Cpu
} from "lucide-react";
import { DbCategory, DbUser } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  categories: DbCategory[];
  selectedCategory: string | null;
  setSelectedCategory: (catSlug: string | null) => void;
  user: DbUser | null;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  categories,
  selectedCategory,
  setSelectedCategory,
  user
}: SidebarProps) {
  
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case "credit-card": return <CreditCard className="w-4 h-4" />;
      case "users": return <Users className="w-4 h-4" />;
      case "shopping-bag": return <ShoppingBag className="w-4 h-4" />;
      case "bar-chart-2": return <BarChart2 className="w-4 h-4" />;
      case "presentation": return <Presentation className="w-4 h-4" />;
      case "book-open": return <BookOpen className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const navItems = [
    { id: "all", label: "All Prompts", icon: <Layers className="w-4 h-4" /> },
    { id: "private", label: "Private", icon: <Lock className="w-4 h-4" /> },
    { id: "public", label: "Public", icon: <Globe className="w-4 h-4" /> },
    { id: "favorites", label: "Favorites", icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <aside id="sidebar-nav" className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-md bg-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-sm border border-purple-800">
          P
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-800 leading-tight">PEA Prompt</h1>
          <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Enterprise Hub</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
          Library Filter
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedCategory(null); // Clear category filter when changing active tab
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-purple-50 text-purple-800 border-l-2 border-purple-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Categories Section */}
        <div className="pt-6">
          <div className="text-[10px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider flex items-center justify-between">
            <span>Use Cases / Categories</span>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-[9px] text-purple-700 hover:underline capitalize"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-1 space-y-0.5">
            {categories.map((cat) => {
              const matchesSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  id={`cat-filter-${cat.slug}`}
                  onClick={() => {
                    setSelectedCategory(cat.slug as string);
                    if (activeTab === "favorites" || activeTab === "private") {
                      // Stay on those tabs, but filter by category
                    } else {
                      setActiveTab("all"); // Default to all if on specific tabs
                    }
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-1.5 text-xs font-normal rounded-md transition-colors text-left ${
                    matchesSelected
                      ? "bg-amber-50 text-amber-900 border-l-2 border-amber-500 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={matchesSelected ? "text-amber-600" : "text-slate-400"}>
                    {getCategoryIcon(cat.icon)}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User profile footer */}
      {user && (
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-700 font-bold text-xs uppercase shadow-inner">
              {user.display_name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.display_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.position || "PEA Employee"}</p>
              <div className="inline-flex items-center space-x-1 mt-0.5 px-1 py-0.2 bg-purple-100 rounded text-[8px] font-bold text-purple-800">
                <span>ID: {user.employee_id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

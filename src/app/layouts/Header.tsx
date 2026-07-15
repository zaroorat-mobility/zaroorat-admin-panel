import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, ChevronDown, Globe, LogOut, Sun, Moon, Menu } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { useAppStore } from "@/store/app.store";
import { Breadcrumbs } from "./Breadcrumbs";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearCredentials } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar } = useAppStore();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [language, setLanguage] = useState("en");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearCredentials();
    navigate("/login");
  };

  return (
    <header className="h-16 w-full flex items-center justify-between px-6 bg-surface border-b border-border sticky top-0 z-20 backdrop-blur-sm bg-surface/95">
      {/* Left side info */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-surface-muted text-muted-foreground mr-1"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs minimal={true} />
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3">
        {/* Theme mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground border border-border hover:bg-surface-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Language selector */}
        <div className="flex items-center gap-1 border border-border px-2.5 py-1.5 rounded-lg hover:bg-surface-muted transition-colors">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs font-semibold bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0 text-foreground"
            aria-label="Select language"
          >
            <option value="en" className="dark:bg-slate-900">EN</option>
            <option value="hi" className="dark:bg-slate-900">HI</option>
            <option value="ur" className="dark:bg-slate-900">UR</option>
          </select>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-muted text-muted-foreground border border-border"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              3
            </span>
          </button>
        </div>

        {/* User Account Dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-muted border border-border text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="hidden md:flex flex-col justify-center">
              <div className="text-xs font-bold text-foreground leading-tight">
                {user?.name || "Administrator"}
              </div>
              <div className="text-[9px] text-muted-foreground capitalize font-medium">
                {user?.role || "Superadmin"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-border py-1 z-30 animate-fadeIn">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;

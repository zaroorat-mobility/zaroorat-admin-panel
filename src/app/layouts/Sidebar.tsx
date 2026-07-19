import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  Activity,
  Navigation,
  Bell,
  LifeBuoy,
  Landmark,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/shared/utils";
import logoImg from "@/assets/images/logo.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | number;
  badgeVariant?: "danger" | "warning" | "info";
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "User Management",
    href: "user-management",
    icon: Users,
    children: [
      { href: "/users", label: "Administrators", icon: Users },
    ],
  },
  {
    label: "Rider Management",
    href: "rider-management",
    icon: Users,
    children: [
      { href: "/riders", label: "Riders Directory", icon: Users },
    ],
  },
  {
    label: "Driver Management",
    href: "driver-management",
    icon: Car,
    children: [
      { href: "/driver-management/applications", label: "Driver Applications", icon: ShieldCheck, badge: 12, badgeVariant: "info" },
      { href: "/driver-management/drivers", label: "Drivers", icon: Users, badge: 3, badgeVariant: "warning" },
      { href: "/driver-management/vehicles", label: "Vehicles", icon: Car },
    ],
  },
  {
    label: "Pricing Management",
    href: "pricing-management",
    icon: DollarSign,
    children: [
      { href: "/pricing-management", label: "Pricing Control Center", icon: LayoutDashboard },
      { href: "/pricing-management/fare-rules", label: "Fare Rules", icon: DollarSign },
      { href: "/pricing-management/surge-rules", label: "Surge Rules", icon: Activity },
      { href: "/pricing-management/cancellation-rules", label: "Cancellation Rules", icon: ShieldCheck },
      { href: "/pricing-management/pricing-history", label: "Pricing History", icon: FileText },
    ],
  },
  {
    label: "Operations",
    href: "operations",
    icon: Activity,
    children: [
      { href: "/operations/ride-monitor", label: "Ride Monitor", icon: Navigation },
      { href: "/operations/sos-monitor", label: "SOS Monitor", icon: Bell },
      { href: "/operations/complaints", label: "Complaints", icon: LifeBuoy },
    ],
  },
  {
    label: "Financial Operations",
    href: "financial-operations",
    icon: DollarSign,
    children: [
      { href: "/financial-operations/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/financial-operations/transactions", label: "Transactions", icon: FileText },
      { href: "/financial-operations/failed-transactions", label: "Failed Transactions", icon: AlertTriangle },
      { href: "/financial-operations/reconciliation", label: "Reconciliation", icon: Activity },
      { href: "/financial-operations/disputes", label: "Disputes", icon: ShieldCheck },
      { href: "/financial-operations/refunds", label: "Refunds", icon: RefreshCw },
      { href: "/financial-operations/settlements", label: "Settlements", icon: Landmark },
      { href: "/financial-operations/audit-logs", label: "Finance Audit Logs", icon: FileText },
    ],
  },
  { href: "/audit-log", label: "Audit Log", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen } = useAppStore();
  const { user } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "user-management", "rider-management", "driver-management", "pricing-management",
    "operations", "financial-operations"
  ]);

  const toggleSection = (href: string) => {
    setExpandedSections(prev =>
      prev.includes(href) ? prev.filter(item => item !== href) : [...prev, href]
    );
  };

  const isItemActive = (href: string): boolean => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => isItemActive(child.href) || location.pathname.startsWith(child.href));
  };

  return (
    <aside
      className={cn(
        "h-screen bg-surface border-r border-border flex flex-col sticky top-0 left-0 transition-all duration-200 z-30 select-none",
        isSidebarOpen ? "w-[260px]" : "w-20"
      )}
    >
      {/* Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src={logoImg} alt="Zaroorat Mobility" className="w-8 h-8 rounded-lg object-contain" />
          {isSidebarOpen && (
            <div>
              <div className="font-semibold text-sm text-foreground tracking-tight">Zaroorat Mobility</div>
              <div className="text-[10px] text-muted-foreground font-medium -mt-0.5">Admin Operations</div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children?.length;
            const isExpanded = expandedSections.includes(item.href);
            const hasActiveChild = hasChildren && isChildActive(item);


            return (
              <div key={item.href}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(item.href);
                    } else {
                      navigate(item.href);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer",
                    hasChildren
                      ? (hasActiveChild
                        ? "text-[#2B317A] bg-[#2B317A]/[0.06] font-semibold dark:text-[#4F5FBF] dark:bg-[#4F5FBF]/[0.15]"
                        : "text-slate-600 hover:bg-[#2B317A]/[0.06] hover:text-[#2B317A] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white")
                      : (isItemActive(item.href)
                        ? "bg-[#2B317A] text-white font-bold shadow-sm"
                        : "text-slate-600 hover:bg-[#2B317A]/[0.06] hover:text-[#2B317A] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white")
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-semibold border",
                          isItemActive(item.href)
                            ? "bg-white/20 text-white border-white/20"
                            : "bg-[#2B317A]/[0.06] text-[#2B317A] border-[#2B317A]/15 dark:bg-[#4F5FBF]/[0.15] dark:text-[#4F5FBF] dark:border-[#4F5FBF]/30"
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {hasChildren && (
                        isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </>
                  )}
                </button>

                {/* Sub Items */}
                {hasChildren && isExpanded && isSidebarOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActiveItem = isItemActive(child.href);

                      return (
                        <button
                          key={child.href}
                          onClick={() => navigate(child.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs cursor-pointer",
                            isChildActiveItem
                              ? "bg-[#2B317A] text-white font-semibold shadow-sm"
                              : "text-slate-500 hover:bg-[#2B317A]/[0.06] hover:text-[#2B317A] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          )}
                        >
                          <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 text-left">{child.label}</span>
                          {child.badge && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-semibold border",
                              isChildActiveItem
                                ? "bg-white/20 text-white border-white/20"
                                : "bg-[#2B317A]/[0.06] text-[#2B317A] border-[#2B317A]/15 dark:bg-[#4F5FBF]/[0.15] dark:text-[#4F5FBF] dark:border-[#4F5FBF]/30"
                            )}>
                              {child.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account card */}
      <div className="p-3 border-t border-border mt-auto">
        <div
          onClick={() => navigate("/settings")}
          className="p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-200/60 dark:bg-slate-800/40 dark:border-slate-800 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
          </div>
          {isSidebarOpen && (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name || "Administrator"}</div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role || "Superadmin"}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;

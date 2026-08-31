import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { platformSections } from "@/modules/platform/platform-nav";
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
  AlertTriangle,
  CreditCard,
  School,
  GraduationCap,
  Tag,
  Gift,
  History,
  Globe2,
  MapPin,
  Shield,
  Compass,
  Radio,
  ShieldAlert,
  Send,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/infrastructure/permissions";
import navbarLogo from "@/assets/images/navbar_logo.jpg";
import heroLogo from "@/assets/images/hero-logo.jpg";
import { cn } from "@/shared/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  permission?: string;
  badge?: string | number;
  badgeVariant?: "danger" | "warning" | "info";
  children?: NavItem[];
  matchActive?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Access Control & Admin Users",
    href: "access-control",
    icon: ShieldCheck,
    children: [
      { href: "/access-control/users", label: "Admin Users", icon: Users, permission: "staff:write" },
      { href: "/access-control/roles", label: "Roles & Permissions", icon: ShieldCheck, permission: "rbac:manage" },
    ],
  },
  {
    label: "Rider Management",
    href: "rider-management",
    icon: Users,
    children: [
      { href: "/riders", label: "Riders Directory", icon: Users, permission: "riders:read" },
    ],
  },
  {
    label: "Driver Management",
    href: "driver-management",
    icon: Car,
    children: [
      { href: "/driver-management/applications", label: "Driver Applications", icon: ShieldCheck, permission: "drivers:read" },
      { href: "/driver-management/drivers", label: "Drivers", icon: Users, permission: "drivers:read" },
    ],
  },
  {
    label: "Vehicle Management",
    href: "vehicle-management",
    icon: Car,
    children: [
      { href: "/vehicle-management/vehicles", label: "Vehicles Directory", icon: Car, permission: "vehicles:read" },
    ],
  },
  {
    label: "Geographic Management",
    href: "geographic-management",
    icon: Globe2,
    children: [
      { href: "/geographic-management", label: "Coverage Dashboard", icon: LayoutDashboard, permission: "geography:read" },
      { href: "/geographic-management/countries", label: "Countries", icon: Globe2, permission: "geography:read" },
      { href: "/geographic-management/states", label: "States", icon: MapPin, permission: "geography:read" },
      { href: "/geographic-management/cities", label: "Cities", icon: MapPin, permission: "geography:read" },
      { href: "/geographic-management/service-zones", label: "Service Zones", icon: Shield, permission: "geography:read" },
      { href: "/geographic-management/surge-zones", label: "Surge Zones", icon: Activity, permission: "pricing:read" },
    ],
  },
  {
    label: "Pricing Management",
    href: "pricing-management",
    icon: DollarSign,
    children: [
      { href: "/pricing-management", label: "Pricing Control Center", icon: LayoutDashboard, permission: "pricing:read" },
      { href: "/pricing-management/fare-rules", label: "Fare Rules", icon: DollarSign },
      { href: "/pricing-management/surge-rules", label: "Surge Rules", icon: Activity },
      { href: "/pricing-management/cancellation-rules", label: "Cancellation Rules", icon: ShieldCheck },
      { href: "/pricing-management/pricing-history", label: "Pricing History", icon: FileText },
      { href: "/pricing-management/gst", label: "GST & Taxation", icon: Landmark },
      { href: "/pricing-management/razorpay", label: "Razorpay Commission", icon: CreditCard },
      { href: "/pricing-management/invoices", label: "Invoices Console", icon: FileText }
    ],
  },
  {
    label: "Communications",
    href: "communications",
    icon: Bell,
    children: [
      { href: "/communications/templates", label: "Templates", icon: FileText, permission: "communications:read" },
      { href: "/communications/push/compose", label: "Compose Push", icon: Send, permission: "communications:write" },
      { href: "/communications/push/history", label: "Push History", icon: History, permission: "communications:read" },
      { href: "/communications/delivery-history", label: "Delivery History", icon: Activity, permission: "communications:read" },
    ],
  },
  {
    label: "Operations",
    href: "operations",
    icon: Activity,
    children: [
      { href: "/operations/ride-monitor", label: "Ride Monitor", icon: Navigation, permission: "operations:read" },
      { href: "/operations/live-dashboard", label: "Live Dashboard", icon: Radio, permission: "operations:read" },
      { href: "/operations/dispatch", label: "Dispatch Console", icon: Compass, permission: "operations:read" },
      { href: "/operations/complaints", label: "Complaints Queue", icon: LifeBuoy, permission: "operations:read" },
      { href: "/operations/safety-center", label: "Safety Center", icon: ShieldAlert, permission: "operations:read" }
    ],
  },
  {
    label: "Financial Operations",
    href: "financial-operations",
    icon: DollarSign,
    children: [
      { href: "/financial-operations/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "finance:read" },
      { href: "/financial-operations/transactions", label: "Transactions", icon: FileText },
      { href: "/financial-operations/failed-transactions", label: "Failed Transactions", icon: AlertTriangle },
      { href: "/financial-operations/reconciliation", label: "Reconciliation", icon: Activity },
      { href: "/financial-operations/disputes", label: "Disputes", icon: ShieldCheck },
      { href: "/financial-operations/refunds", label: "Refunds", icon: RefreshCw },
      { href: "/financial-operations/settlements", label: "Settlements", icon: Landmark },
      { href: "/financial-operations/audit-logs", label: "Finance Audit Logs", icon: FileText },
    ],
  },
  {
    label: "School Mobility",
    href: "school-mobility",
    icon: School,
    children: [
      { href: "/school-mobility/student-registry", label: "Student Registry", icon: GraduationCap, permission: "school:read" },
      { href: "/school-mobility/route-optimization", label: "Route Optimization", icon: Navigation },
      { href: "/school-mobility/parent-portal", label: "Parent Portal Settings", icon: Settings }
    ]
  },
  {
    label: "Promotions & Campaigns",
    href: "promotions-management",
    icon: Tag,
    children: [
      { href: "/promotions-management/promotions", label: "Promotions", icon: Tag, permission: "campaigns:read" },
      { href: "/promotions-management/campaigns", label: "Campaigns", icon: Bell },
      { href: "/promotions-management/batches", label: "Coupon Batches", icon: CreditCard },
      { href: "/promotions-management/segments", label: "Audience Segments", icon: Users },
      { href: "/promotions-management/banners", label: "Banners", icon: FileText },
      { href: "/promotions-management/reports", label: "Reports", icon: Activity },
    ],
  },
  {
    label: "Referral & Rewards",
    href: "referral-management",
    icon: Gift,
    children: [
      { href: "/referral-management/rider/programs", label: "Rider programs", icon: Users, permission: "referrals:read" },
      { href: "/referral-management/rider/codes", label: "Rider codes", icon: Tag, permission: "referrals:read" },
      { href: "/referral-management/rider/history", label: "Rider history", icon: History, permission: "referrals:read" },
      { href: "/referral-management/driver/programs", label: "Driver programs", icon: Car, permission: "referrals:read" },
      { href: "/referral-management/driver/codes", label: "Driver codes", icon: Tag, permission: "referrals:read" },
      { href: "/referral-management/driver/history", label: "Driver history", icon: History, permission: "referrals:read" },
    ],
  },
  { href: "/document-controller", label: "Document Controller", icon: FileText, permission: "documents:read" },
  { href: "/carpooling", label: "Carpooling Rules", icon: Car, permission: "carpooling:read" },
  { href: "/audit-log", label: "Audit Log", icon: FileText, permission: "audit:read" },
  {
    label: "Platform",
    href: "platform",
    icon: Settings,
    children: [],
  },
];

function buildPlatformNavChildren(user: ReturnType<typeof useAuthStore.getState>["user"]): NavItem[] {
  return platformSections
    .filter((section) => hasPermission(user, section.permission))
    .map((section) => ({
      href: section.defaultHref,
      label: section.label,
      icon: section.icon,
      permission: section.permission,
      matchActive: section.isActive,
    }));
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen } = useAppStore();
  const { user } = useAuthStore();
  const itemVisible = (item: NavItem, inherited?: string): boolean => {
    const required = item.permission ?? inherited;
    if (item.children?.length) {
      const next = item.children.find((child) => child.permission)?.permission ?? required;
      return item.children.some((child) => itemVisible(child, next));
    }
    if (!required) return true;
    return hasPermission(user, required);
  };
  const navWithPlatform = useMemo(() => {
    const platformChildren = buildPlatformNavChildren(user);
    return navItems.map((item) =>
      item.href === "platform" ? { ...item, children: platformChildren } : item,
    );
  }, [user]);

  const visibleNav = navWithPlatform
    .map((item) => {
      if (!item.children) return itemVisible(item) ? item : null;
      const inherited = item.children.find((child) => child.permission)?.permission;
      const children = item.children.filter((child) => itemVisible(child, inherited));
      if (children.length === 0) return null;
      return { ...item, children };
    })
    .filter((item): item is NavItem => item != null);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "access-control", "user-management", "rider-management", "driver-management", "vehicle-management", "geographic-management", "pricing-management",
    "promotions-management", "referral-management", "communications", "operations", "financial-operations", "school-mobility", "platform"
  ]);

  const toggleSection = (href: string) => {
    setExpandedSections(prev =>
      prev.includes(href) ? prev.filter(item => item !== href) : [...prev, href]
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.matchActive) return item.matchActive(location.pathname);
    const href = item.href;
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => isItemActive(child));
  };

  return (
    <aside
      className={cn(
        "h-screen bg-surface border-r border-border flex flex-col sticky top-0 left-0 transition-all duration-200 z-30 select-none",
        isSidebarOpen ? "w-[260px]" : "w-20"
      )}
    >
      {/* Logo Header */}
      <div className={cn("h-16 flex items-center border-b border-border justify-center", isSidebarOpen ? "px-6" : "px-4")}>
        <Link to="/dashboard" className="flex items-center w-full justify-center">
          {isSidebarOpen ? (
            <img src={navbarLogo} alt="Zaroorat Mobility" className="h-8 max-w-[210px] object-contain block" />
          ) : (
            <img src={heroLogo} alt="Zaroorat" className="w-8 h-8 rounded-lg object-contain block" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {visibleNav.map((item) => {
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
                      : (isItemActive(item)
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
                          isItemActive(item)
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
                      const isChildActiveItem = isItemActive(child);

                      return (
                        <button
                          key={child.href}
                          type="button"
                          onClick={() => navigate(child.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs cursor-pointer",
                            isChildActiveItem
                              ? "bg-[#2B317A] text-white font-semibold shadow-sm ring-1 ring-[#2B317A]/20"
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
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 flex items-center gap-2">
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

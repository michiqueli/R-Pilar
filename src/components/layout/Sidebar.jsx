
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { CraneLogoSVG } from '@/components/ui/CraneLogoSVG';
import { SIDEBAR_SECTIONS } from '@/config/sidebarConfig';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveRoute = (item) => {
    if (item.match) {
      return item.match.test(location.pathname);
    }
    return location.pathname.startsWith(item.path);
  };

  const SidebarItem = ({ item, collapsed }) => {
  const active = isActiveRoute(item);
  const translationKey = item.translationKey || item.name.toLowerCase();
  const label = t(`nav.${item.name}`);
    
    const content = (
      <NavLink
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
          active
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
          collapsed && "justify-center px-2"
        )}
      >
        <item.icon 
          className={cn(
            "flex-shrink-0 transition-colors",
            collapsed ? "w-6 h-6" : "w-5 h-5",
            active ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
          )} 
        />
        
        {!collapsed && (
          <span className="font-medium text-sm truncate">
            {label}
          </span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 print:hidden shadow-sm",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn(
        "h-16 flex items-center border-b border-slate-200 dark:border-slate-800 relative transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "px-6"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
           <div className="w-8 h-8 flex-shrink-0 text-blue-600 dark:text-blue-500">
             <CraneLogoSVG className="w-full h-full" />
           </div>
           
           {!isCollapsed && (
             <div className="flex flex-col min-w-0 transition-opacity duration-300">
               <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                 {t('app.name')}
               </span>
               <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5 truncate">
                 System v2.0
               </span>
             </div>
           )}
        </div>

        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-500 hover:text-blue-600 transition-colors shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 custom-scrollbar space-y-6">
        {SIDEBAR_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                {t(`sidebar.${section.title}`)}
              </div>
            )}
            
            {isCollapsed && idx > 0 && <div className="h-px w-8 mx-auto bg-slate-100 dark:bg-slate-800 my-2" />}

            <div className="space-y-1">
              {section.items.map((item, itemIdx) => (
                <SidebarItem key={itemIdx} item={item} collapsed={isCollapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center w-full" : "flex-1 min-w-0")}>
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                {user?.email ? user.email.charAt(0).toUpperCase() : <User size={18} />}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleLogout}
                  className={cn(
                    "p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-200 dark:hover:bg-slate-800",
                    isCollapsed ? "p-2" : ""
                  )}
                >
                  <LogOut size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "top"}>
                <p>{t('auth.logout')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

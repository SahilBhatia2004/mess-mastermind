import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Users, CalendarDays,
  FileText, Settings, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/upload', label: 'Upload Data', icon: Upload },
  { to: '/soldiers', label: 'Soldiers', icon: Users },
  { to: '/daily-entry', label: 'Daily Entry', icon: CalendarDays },
  { to: '/bills', label: 'Bills', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 z-10',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-sidebar-border min-h-[60px]">
        <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
          <Shield className="w-4 h-4 text-olive" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-rajdhani font-bold text-sm text-sidebar-foreground leading-none tracking-wider uppercase">Mess</p>
            <p className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">Management</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto scrollbar-thin">
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded text-sm transition-all duration-150',
                isActive
                  ? 'sidebar-item-active text-sidebar-primary-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn('flex-shrink-0 w-4 h-4', isActive ? 'text-olive' : '')} />
              {!collapsed && <span className="font-rajdhani font-medium tracking-wide truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-sidebar-border text-muted-foreground hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

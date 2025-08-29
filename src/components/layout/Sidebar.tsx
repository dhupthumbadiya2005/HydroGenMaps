import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Map, 
  Database, 
  FileText, 
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationItems = [
  {
    name: 'Explore',
    href: '/explore',
    icon: Map,
    description: 'Search and analyze locations'
  },
  {
    name: 'Assets',
    href: '/assets',
    icon: Database,
    description: 'Manage your assets'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'View generated reports'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">H</span>
              </div>
              <span className="font-semibold text-sm">HydroGenMaps</span>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-3 w-full p-3 rounded-lg transition-colors text-left",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-75 truncate">
                        {item.description}
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
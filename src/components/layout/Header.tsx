import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuButton = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            HydroGenMaps
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="hover:bg-secondary"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </div>
    </header>
  );
};
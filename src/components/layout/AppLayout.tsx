import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Route, 
  Lightbulb, 
  CheckSquare, 
  History, 
  FileDown,
  Menu,
  X,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { PDFExportButton } from '@/components/pdf/PDFExportButton';

interface NavItem {
  href: string;
  label: string;
  icon: typeof MapPin;
}

const navItems: NavItem[] = [
  { href: '/route', label: 'Route', icon: Route },
  { href: '/places', label: 'Orte & Vorschläge', icon: Lightbulb },
  { href: '/todos', label: 'ToDos', icon: CheckSquare },
  { href: '/log', label: 'Log', icon: History },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { currentUser } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-lg font-semibold text-foreground">
                  Vietnam Trip
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Planner</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <PDFExportButton />
              
              {currentUser && (
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                      <User className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <span className="hidden sm:inline text-sm">
                      {currentUser.name}
                    </span>
                  </Button>
                </Link>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card animate-slide-up">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

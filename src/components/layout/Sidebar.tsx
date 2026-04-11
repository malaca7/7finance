import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Gauge, 
  Wrench, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  MessageCircle,
  User,
  Bell,
  ChevronDown,
  Crown,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  Send
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { clsx } from 'clsx';

type MenuItem = {
  path: string;
  label: string;
  icon: React.ElementType;
};

type MenuCategory = {
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
};

const personalCategories: MenuCategory[] = [
  {
    title: 'Eu',
    icon: User,
    items: [
      { path: '/dashboard', label: 'Início', icon: LayoutDashboard },
      { path: '/perfil', label: 'Perfil', icon: User },
      { path: '/planos', label: 'Planos', icon: Crown },
    ],
  },
  {
    title: 'Financeiro',
    icon: TrendingUp,
    items: [
      { path: '/ganhos', label: 'Ganhos', icon: TrendingUp },
      { path: '/despesas', label: 'Gastos', icon: TrendingDown },
    ],
  },
  {
    title: 'Meus Carros',
    icon: Wrench,
    items: [
      { path: '/km', label: 'KM', icon: Gauge },
      { path: '/manutencao', label: 'Carro', icon: Wrench },
    ],
  },
  {
    title: 'Social',
    icon: MessageCircle,
    items: [
      { path: '/chat', label: 'Mensagens', icon: MessageCircle },
      { path: '/notifications', label: 'Notificações', icon: Bell },
    ],
  },
];

const adminCategory: MenuCategory = {
  title: 'Moderação',
  icon: Settings,
  items: [
    { path: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Usuários', icon: Users },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/logs', label: 'Logs', icon: FileText },
    { path: '/admin/alerts', label: 'Alertas', icon: AlertTriangle },
    { path: '/admin/notifications', label: 'Notificações', icon: Send },
  ],
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('sidebar_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    const cats = personalCategories.map(c => c.title);
    cats.push(adminCategory.title);
    return cats;
  });

  useEffect(() => {
    sessionStorage.setItem('sidebar_categories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  useEffect(() => {
    const handler = (e: any) => {
      setIsCollapsed(e.detail?.isCollapsed);
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const isAdmin = user?.role === 'admin';
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { isCollapsed: newState } }));
  };

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isCategoryExpanded = (title: string) => expandedCategories.includes(title);

  const renderMenuItem = (item: MenuItem, isActive: boolean, customActiveClass?: string) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={clsx(
          "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 font-semibold",
          isActive
            ? customActiveClass || "bg-secondary text-white font-bold"
            : "text-neutral hover:bg-primary/10 hover:text-primary"
        )}
      >
        <Icon className="w-7 h-7 shrink-0" />
        {!isCollapsed && <span className="text-lg font-semibold leading-none truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={clsx(
          "hidden lg:flex fixed top-16 left-0 h-[calc(100vh-4rem)] bg-premium-dark border-r border-white/5 flex-col z-30 transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-24" : "w-72"
        )}
      >
        <button
          onClick={toggleSidebar}
          className={clsx(
            "hidden lg:block absolute -right-3 top-6 z-[60]",
          )}
          title={isCollapsed ? "Abrir menu" : "Fechar menu"}
        >
          <div className="bg-primary text-black rounded-full p-1.5 shadow-glow-green hover:scale-110 transition-transform border-2 border-premium-dark">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </div>
        </button>
        
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto py-6 px-2">
          {personalCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
            <div key={category.title} className="flex flex-col gap-1">
              <button
                onClick={() => toggleCategory(category.title)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3 text-base uppercase tracking-wider font-bold transition-all duration-200 rounded-xl mx-1 bg-primary text-black",
                  isCollapsed ? "justify-center px-2" : ""
                )}
              >
                <CategoryIcon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left">{category.title}</span>}
                {!isCollapsed && (
                  <ChevronDown className={clsx("w-4 h-4 transition-transform", isCategoryExpanded(category.title) ? "rotate-0" : "-rotate-90")} />
                )}
              </button>
              
              {isCategoryExpanded(category.title) && category.items.map((item) => {
                const isActive = location.pathname === item.path;
                return renderMenuItem(item, isActive);
              })}
            </div>
            );
          })}
          
          {isAdmin && (() => {
            const CategoryIcon = adminCategory.icon;
            return (
            <div key={adminCategory.title} className="flex flex-col gap-1">
              <button
                onClick={() => toggleCategory(adminCategory.title)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3 text-base uppercase tracking-wider font-bold transition-all duration-200 rounded-xl mx-1 bg-primary text-black",
                  isCollapsed ? "justify-center px-2" : ""
                )}
              >
                <CategoryIcon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left">{adminCategory.title}</span>}
                {!isCollapsed && (
                  <ChevronDown className={clsx("w-4 h-4 transition-transform", isCategoryExpanded(adminCategory.title) ? "rotate-0" : "-rotate-90")} />
                )}
              </button>
              
              {isCategoryExpanded(adminCategory.title) && adminCategory.items.map((item) => {
                const isActive = location.pathname === item.path;
                return renderMenuItem(item, isActive, "bg-premium-gold text-black font-bold");
              })}
            </div>
            );
          })()}
        </nav>
        
        <div className="p-2 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-neutral hover:text-negative hover:bg-negative/10 font-semibold transition-all duration-200"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span className="text-base font-semibold leading-none">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-premium-dark border-t border-white/5 z-[100] flex justify-around items-center px-0.5 pb-safe">
        {personalCategories.flatMap(category => category.items).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 rounded-xl mx-0.5 touch-manipulation active:scale-95",
                isActive ? "bg-secondary text-white" : "text-neutral hover:text-primary hover:bg-primary/10"
              )}
              style={{ fontSize: 11 }}
            >
              <Icon className={clsx("w-6 h-6", isActive ? "scale-110" : "")}/>
              <span className={clsx("truncate max-w-[65px] text-[10px]", isActive ? "text-white font-bold" : "text-neutral")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
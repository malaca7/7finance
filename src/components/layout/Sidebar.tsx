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
  Send,
  Car
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
      { path: '/veiculos', label: 'Veículos', icon: Car },
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
    { path: '/admin/plans', label: 'Planos', icon: Crown },
  ],
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileCategory, setMobileCategory] = useState<number | null>(null);
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
      {(() => {
        // Determinar categoria ativa baseada na rota atual
        const activeCatIndex = personalCategories.findIndex(cat =>
          cat.items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
        );
        const defaultCat = activeCatIndex >= 0 ? activeCatIndex : 0;

        return (
          <div className="lg:hidden fixed bottom-0 left-0 w-full z-[100]">
            {/* Itens da categoria selecionada */}
            {mobileCategory !== null && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/40 z-[99]"
                  onClick={() => setMobileCategory(null)}
                />
                <div className="relative z-[101] bg-premium-dark border-t border-white/10 px-2 pt-2 pb-1 animate-slideUp">
                  <div className="flex justify-around items-center gap-1">
                    {personalCategories[mobileCategory].items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileCategory(null)}
                          className={clsx(
                            "flex flex-col items-center justify-center flex-1 py-2.5 gap-1 rounded-xl transition-all duration-200 touch-manipulation active:scale-95",
                            isActive ? "bg-secondary text-white" : "text-neutral hover:text-primary hover:bg-primary/10"
                          )}
                        >
                          <Icon className={clsx("w-5 h-5", isActive && "scale-110")} />
                          <span className={clsx("text-[10px] truncate max-w-[70px]", isActive ? "text-white font-bold" : "text-neutral")}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Barra de categorias */}
            <nav className="bg-premium-dark border-t border-white/5 h-16 flex justify-around items-center px-1 pb-safe">
              {personalCategories.map((cat, idx) => {
                const CatIcon = cat.icon;
                const isCatActive = idx === defaultCat;
                const isExpanded = mobileCategory === idx;
                return (
                  <button
                    key={cat.title}
                    onClick={() => setMobileCategory(isExpanded ? null : idx)}
                    className={clsx(
                      "flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded-xl mx-0.5 transition-all duration-200 touch-manipulation active:scale-95",
                      isExpanded
                        ? "bg-primary/20 text-primary"
                        : isCatActive
                          ? "text-white"
                          : "text-neutral hover:text-primary"
                    )}
                  >
                    <CatIcon className={clsx("w-6 h-6", (isCatActive || isExpanded) && "scale-110")} />
                    <span className={clsx(
                      "text-[10px] truncate max-w-[65px]",
                      isExpanded ? "text-primary font-bold" : isCatActive ? "text-white font-bold" : "text-neutral"
                    )}>
                      {cat.title}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        );
      })()}
    </>
  );
}
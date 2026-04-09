import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Earnings, Expense, KmRegistry, Maintenance, DashboardSummary, EarningsType, ExpenseType, DateFilter } from '../types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Data
  earnings: Earnings[];
  expenses: Expense[];
  kmRegistries: KmRegistry[];
  maintenances: Maintenance[];
  allUsers: User[];
  
  // UI State
  isLoading: boolean;
  dateFilter: DateFilter;
  dashboardSummary: DashboardSummary | null;
  
  // Auth Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  
  // Data Actions
  setEarnings: (earnings: Earnings[]) => void;
  addEarnings: (earning: Earnings) => void;
  updateEarnings: (id: number, data: Partial<Earnings>) => void;
  deleteEarnings: (id: number) => void;
  
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: number, data: Partial<Expense>) => void;
  deleteExpense: (id: number) => void;
  
  setKmRegistries: (registries: KmRegistry[]) => void;
  addKmRegistry: (registry: KmRegistry) => void;
  updateKmRegistry: (id: number, data: Partial<KmRegistry>) => void;
  deleteKmRegistry: (id: number) => void;
  
  setMaintenances: (maintenances: Maintenance[]) => void;
  addMaintenance: (maintenance: Maintenance) => void;
  updateMaintenance: (id: number, data: Partial<Maintenance>) => void;
  deleteMaintenance: (id: number) => void;
  
  setAllUsers: (users: User[]) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setDateFilter: (filter: DateFilter) => void;
  setDashboardSummary: (summary: DashboardSummary) => void;
  
  // Computed helpers
  calculateSummary: () => DashboardSummary;
}

const initialSummary: DashboardSummary = {
  totalGanhos: 0,
  totalDespesas: 0,
  lucroLiquido: 0,
  kmRodados: 0,
  ganhosPorTipo: {
    corrida: 0,
    gorjeta: 0,
    dinheiro: 0,
  },
  despesasPorTipo: {
    abastecimento: 0,
    manutencao: 0,
    lavagem: 0,
    pedagio: 0,
    alimentacao: 0,
    aluguel: 0,
    parcela: 0,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      earnings: [],
      expenses: [],
      kmRegistries: [],
      maintenances: [],
      allUsers: [],
      isLoading: false,
      dateFilter: 'mensal',
      dashboardSummary: null,
      
      // Auth Actions
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          earnings: [],
          expenses: [],
          kmRegistries: [],
          maintenances: [],
          dashboardSummary: null,
        });
      },
      
      setUser: (user) => set({ user }),
      
      // Earnings Actions
      setEarnings: (earnings) => {
        set({ earnings });
        get().calculateSummary();
      },
      addEarnings: (earning) => {
        set((state) => ({ 
          earnings: [earning, ...state.earnings] 
        }));
        get().calculateSummary();
      },
      updateEarnings: (id, data) => {
        set((state) => ({
          earnings: state.earnings.map(e => 
            e.id === id ? { ...e, ...data } : e
          ),
        }));
        get().calculateSummary();
      },
      deleteEarnings: (id) => {
        set((state) => ({
          earnings: state.earnings.filter(e => e.id !== id),
        }));
        get().calculateSummary();
      },
      
      // Expenses Actions
      setExpenses: (expenses) => {
        set({ expenses });
        get().calculateSummary();
      },
      addExpense: (expense) => {
        set((state) => ({ 
          expenses: [expense, ...state.expenses] 
        }));
        get().calculateSummary();
      },
      updateExpense: (id, data) => {
        set((state) => ({
          expenses: state.expenses.map(e => 
            e.id === id ? { ...e, ...data } : e
          ),
        }));
        get().calculateSummary();
      },
      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter(e => e.id !== id),
        }));
        get().calculateSummary();
      },
      
      // KM Registry Actions
      setKmRegistries: (registries) => {
        set({ kmRegistries: registries });
        get().calculateSummary();
      },
      addKmRegistry: (registry) => {
        set((state) => ({ 
          kmRegistries: [registry, ...state.kmRegistries] 
        }));
        get().calculateSummary();
      },
      updateKmRegistry: (id, data) => {
        set((state) => ({
          kmRegistries: state.kmRegistries.map(k => 
            k.id === id ? { ...k, ...data, km_total: (data.km_final && k.km_inicial) ? data.km_final - k.km_inicial : k.km_total } : k
          ),
        }));
        get().calculateSummary();
      },
      deleteKmRegistry: (id) => {
        set((state) => ({
          kmRegistries: state.kmRegistries.filter(k => k.id !== id),
        }));
        get().calculateSummary();
      },
      
      // Maintenance Actions
      setMaintenances: (maintenances) => {
        set({ maintenances });
        get().calculateSummary();
      },
      addMaintenance: (maintenance) => {
        set((state) => ({ 
          maintenances: [maintenance, ...state.maintenances] 
        }));
        get().calculateSummary();
      },
      updateMaintenance: (id, data) => {
        set((state) => ({
          maintenances: state.maintenances.map(m => 
            m.id === id ? { ...m, ...data } : m
          ),
        }));
        get().calculateSummary();
      },
      deleteMaintenance: (id) => {
        set((state) => ({
          maintenances: state.maintenances.filter(m => m.id !== id),
        }));
        get().calculateSummary();
      },
      
      // All Users (Admin)
      setAllUsers: (users) => set({ allUsers: users }),
      
      // UI Actions
      setLoading: (isLoading) => set({ isLoading }),
      setDateFilter: (dateFilter) => set({ dateFilter }),
      setDashboardSummary: (dashboardSummary) => set({ dashboardSummary }),
      
      // Calculate Summary
      calculateSummary: () => {
        const { earnings, expenses, kmRegistries } = get();
        
        const ganhosPorTipo: Record<EarningsType, number> = {
          corrida: 0,
          gorjeta: 0,
          dinheiro: 0,
        };
        
        const despesasPorTipo: Record<ExpenseType, number> = {
          abastecimento: 0,
          manutencao: 0,
          lavagem: 0,
          pedagio: 0,
          alimentacao: 0,
          aluguel: 0,
          parcela: 0,
        };
        
        let totalGanhos = 0;
        let totalDespesas = 0;
        let kmRodados = 0;
        
        earnings.forEach(e => {
          totalGanhos += e.valor;
          ganhosPorTipo[e.tipo] += e.valor;
        });
        
        expenses.forEach(e => {
          totalDespesas += e.valor;
          despesasPorTipo[e.tipo] += e.valor;
        });
        
        kmRegistries.forEach(k => {
          kmRodados += k.km_total ?? 0;
        });
        
        const summary: DashboardSummary = {
          totalGanhos,
          totalDespesas,
          lucroLiquido: totalGanhos - totalDespesas,
          kmRodados,
          ganhosPorTipo,
          despesasPorTipo,
        };
        
        set({ dashboardSummary: summary });
        return summary;
      },
    }),
    {
      name: 'malaca-finance-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

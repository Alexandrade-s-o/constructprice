import React from 'react';
import { LayoutDashboard, Package, Tag, Users, TrendingUp, FileText, Settings, LogOut, HardHat } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout, isOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materiales', icon: Package },
    { id: 'analytics', label: 'Análisis y Precios', icon: TrendingUp },
    { id: 'reports', label: 'Reportes IA', icon: FileText },
    { id: 'suppliers', label: 'Proveedores', icon: Users },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1E2A38] text-white flex flex-col shadow-xl`}>
      <div className="p-6 flex items-center gap-3 border-b border-gray-700">
        <div className="bg-orange-500 p-2 rounded-lg">
          <HardHat size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">ConstructPrice</h1>
          <p className="text-xs text-gray-400">Gestor de Costos</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

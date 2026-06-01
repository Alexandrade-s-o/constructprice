import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MaterialsView from './components/MaterialsView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import MaterialModal from './components/MaterialModal';
import { Material } from './types';
import { INITIAL_MATERIALS } from './constants';
import { Menu } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// Sincronización en tiempo real (WebSocket): solo si hay un servidor disponible.
// En Vercel no hay WebSocket persistente, así que se desactiva automáticamente.
const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ??
  (import.meta.env.DEV ? 'http://localhost:3001' : '');
const socket: Socket | null = SOCKET_URL ? io(SOCKET_URL) : null;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Realtime Connection (solo si hay servidor de sockets)
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Conectado al servidor de precios en tiempo real');
    });

    socket.on('priceUpdated', (data: any) => {
      console.log('Actualización recibida:', data);
      setMaterials(prev => prev.map(m =>
        m.id === data.id ? {
          ...m,
          price: data.price,
          trend: data.trend,
          lastUpdated: data.lastUpdated.split('T')[0]
        } : m
      ));
    });

    return () => {
      socket.off('connect');
      socket.off('priceUpdated');
    };
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleSaveMaterial = (data: Partial<Material>) => {
    if (editingMaterial) {
      // Update existing
      const updatedMaterial = { ...editingMaterial, ...data } as Material;

      // Update local state immediately
      setMaterials(materials.map(m => m.id === editingMaterial.id ? updatedMaterial : m));

      // Emit socket event for others (si hay servidor de sockets)
      socket?.emit('updatePrice', {
        id: updatedMaterial.id,
        price: updatedMaterial.price,
        trend: updatedMaterial.trend
      });

    } else {
      // Add new
      const newMaterial: Material = {
        ...data as Material,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString().split('T')[0],
        trend: 'stable',
        history: []
      };
      setMaterials([newMaterial, ...materials]);
    }
  };

  const handleAddSearchedMaterial = (material: Material) => {
    setMaterials(prev => [material, ...prev]);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard materials={materials} onAddMaterial={handleAddSearchedMaterial} />;
      case 'materials':
        return (
          <MaterialsView
            materials={materials}
            setMaterials={setMaterials}
            onEdit={handleEditMaterial}
            onAdd={handleAddMaterial}
          />
        );
      case 'analytics':
        return <AnalyticsView materials={materials} />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
            <h2 className="text-xl font-bold mb-2">En Desarrollo</h2>
            <p>El módulo de {currentView} estará disponible próximamente.</p>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] text-[#1E2A38] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between md:hidden sticky top-0 z-20">
          <div className="font-bold text-lg text-[#1E2A38]">ConstructPrice</div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {renderView()}
          </div>
        </main>
      </div>

      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMaterial}
        initialData={editingMaterial}
      />
    </div>
  );
};

export default App;

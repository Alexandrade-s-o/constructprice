import React from 'react';
import { Material, Category, Unit } from '../types';
import StatsCard from './StatsCard';
import { Package, TrendingUp, DollarSign, Activity, FileText, Loader2, Search, Globe, ExternalLink, ArrowUp, ArrowDown, Minus, PlusCircle } from 'lucide-react';
import { generateMarketReport, updateMaterialWithAI } from '../services/aiService';
import { hasApiKey } from '../services/apiKey';

interface DashboardProps {
  materials: Material[];
  onAddMaterial: (material: Material) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ materials, onAddMaterial }) => {
  const totalMaterials = materials.length;
  const avgPrice = materials.reduce((acc, m) => acc + m.price, 0) / (totalMaterials || 1);
  const upTrendCount = materials.filter(m => m.trend === 'up').length;
  const [report, setReport] = React.useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = React.useState(false);

  // --- Buscador de cualquier material en la web ---
  const [query, setQuery] = React.useState('');
  const [searchUnit, setSearchUnit] = React.useState<Unit>(Unit.PIEZA);
  const [searchCategory, setSearchCategory] = React.useState<Category>(Category.CEMENTOS);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResult, setSearchResult] = React.useState<Material | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [added, setAdded] = React.useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = query.trim();
    if (!name) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    setAdded(false);

    const updates = await updateMaterialWithAI({
      id: 'tmp',
      name,
      unit: searchUnit,
      category: searchCategory,
      supplier: '',
      price: 0,
      currency: 'COP',
      trend: 'stable',
      history: [],
    } as Material);

    if (updates && typeof updates.price === 'number') {
      const newMaterial: Material = {
        id: Date.now().toString(),
        name,
        category: searchCategory,
        supplier: updates.supplier || 'Web',
        price: updates.price,
        currency: 'COP',
        unit: searchUnit,
        lastUpdated: updates.lastUpdated || new Date().toISOString().split('T')[0],
        trend: (updates.trend as Material['trend']) || 'stable',
        url: updates.url,
        history: [],
        description: updates.description,
      };
      setSearchResult(newMaterial);
    } else {
      setSearchError('No se encontró un precio para ese material. Verifica tus API Keys en Configuración o intenta con otro nombre.');
    }
    setIsSearching(false);
  };

  const handleAddResult = () => {
    if (searchResult) {
      onAddMaterial(searchResult);
      setAdded(true);
    }
  };

  // Get recent updates (mock logic, normally would sort by date)
  const recentUpdates = materials.slice(0, 5);

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    const result = await generateMarketReport(materials);
    setReport(result);
    setIsLoadingReport(false);
    if (!result.includes("API Key")) {
      alert("Reporte Generado:\n\n" + result);
    } else {
      alert(result);
    }
  };

  const trendBadge = (trend: Material['trend']) => {
    if (trend === 'up') return <span className="text-red-500 inline-flex items-center gap-1 text-xs font-medium bg-red-50 py-1 px-2 rounded-full"><ArrowUp size={14} /> Sube</span>;
    if (trend === 'down') return <span className="text-green-500 inline-flex items-center gap-1 text-xs font-medium bg-green-50 py-1 px-2 rounded-full"><ArrowDown size={14} /> Baja</span>;
    return <span className="text-gray-500 inline-flex items-center gap-1 text-xs font-medium bg-gray-100 py-1 px-2 rounded-full"><Minus size={14} /> Estable</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resumen General</h2>
        <p className="text-gray-500 text-sm">Bienvenido al panel de control de precios.</p>
      </div>

      {/* ===== Buscador de cualquier material en la web ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-50 text-orange-600 p-2 rounded-lg"><Globe size={20} /></div>
          <div>
            <h3 className="font-bold text-gray-900">Buscar precio de cualquier material</h3>
            <p className="text-xs text-gray-500">Escribe el material y la IA buscará su precio real en internet.</p>
          </div>
        </div>

        {!hasApiKey() && (
          <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            Configura tus API Keys (Groq y Tavily) en <strong>Configuración</strong> para buscar precios reales.
          </div>
        )}

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Cemento Argos 50kg, Varilla 1/2, Teja Eternit..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value as Category)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
            {Object.values(Category).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={searchUnit} onChange={(e) => setSearchUnit(e.target.value as Unit)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
            {Object.values(Unit).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="submit" disabled={isSearching || !query.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm">
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searchError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{searchError}</div>
        )}

        {searchResult && (
          <div className="mt-4 border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{searchResult.name}</p>
                <p className="text-xs text-gray-500">{searchResult.supplier} • {searchResult.category}</p>
                {searchResult.description && <p className="text-xs text-gray-400 mt-1 max-w-lg">{searchResult.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${searchResult.price.toLocaleString('es-CO')}</p>
                <p className="text-xs text-gray-500 uppercase mb-1">{searchResult.currency} / {searchResult.unit}</p>
                {trendBadge(searchResult.trend)}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {searchResult.url && (
                <a href={searchResult.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                  Ver fuente <ExternalLink size={14} />
                </a>
              )}
              <button onClick={handleAddResult} disabled={added}
                className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors ${added ? 'bg-green-50 text-green-600' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                <PlusCircle size={16} /> {added ? 'Agregado al inventario' : 'Agregar al inventario'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Materiales"
          value={totalMaterials}
          icon={Package}
          color="text-orange-600 bg-orange-50"
        />
        <StatsCard
          title="Precio Promedio"
          value={`$${avgPrice.toFixed(2)}`}
          icon={DollarSign}
          trend="up"
          trendValue="2.4%"
          color="text-green-600 bg-green-50"
        />
        <StatsCard
          title="Materiales al Alza"
          value={upTrendCount}
          icon={TrendingUp}
          color="text-red-600 bg-red-50"
        />
        <StatsCard
          title="Índice de Actividad"
          value="Alta"
          icon={Activity}
          color="text-blue-600 bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Actividad Reciente</h3>
            <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">Ver todo</button>
          </div>
          <div className="space-y-4">
            {recentUpdates.map((material, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {material.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{material.name}</p>
                    <p className="text-xs text-gray-500">{material.supplier} • {material.lastUpdated}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">${material.price}</p>
                  <p className={`text-xs ${material.trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                    {material.trend === 'up' ? 'Sube' : 'Baja'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Notifications */}
        <div className="bg-[#1E2A38] rounded-xl shadow-sm p-6 text-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-2">Reporte Semanal IA</h3>
            <p className="text-gray-300 text-sm mb-6">
              La inteligencia artificial ha detectado una variación inusual en los precios del acero y cemento esta semana.
            </p>
            <div className="space-y-3">
              <div className="bg-white/10 p-3 rounded-lg text-sm flex justify-between items-center">
                <span>Cemento</span>
                <span className="text-orange-400 font-bold">+5%</span>
              </div>
              <div className="bg-white/10 p-3 rounded-lg text-sm flex justify-between items-center">
                <span>Acero</span>
                <span className="text-green-400 font-bold">-2%</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isLoadingReport}
            className="mt-6 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoadingReport ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            {isLoadingReport ? 'Generando...' : 'Generar Reporte Completo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

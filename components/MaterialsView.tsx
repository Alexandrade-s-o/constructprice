import React, { useState } from 'react';
import { Search, Filter, Plus, Edit2, ExternalLink, ArrowUp, ArrowDown, Minus, RefreshCw, Globe, KeyRound } from 'lucide-react';
import { Material, Category, Unit } from '../types';
import { SUPPLIERS } from '../constants';
import { updateMaterialWithAI } from '../services/aiService';
import { hasApiKey } from '../services/apiKey';

interface MaterialsViewProps {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  onEdit: (material: Material) => void;
  onAdd: () => void;
}

const MaterialsView: React.FC<MaterialsViewProps> = ({ materials, setMaterials, onEdit, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAIUpdate = async (material: Material) => {
    setUpdatingId(material.id);
    const updates = await updateMaterialWithAI(material);
    if (updates) {
      setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, ...updates } : m));
    }
    setUpdatingId(null);
    return !!updates;
  };

  const handleUpdateAll = async () => {
    if (!confirm("¿Deseas actualizar los precios de todos los materiales mostrados? Esto puede tardar un momento.")) return;

    setIsUpdatingAll(true);
    for (const material of filteredMaterials) {
      await handleAIUpdate(material);
      // Pequeño delay para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setIsUpdatingAll(false);
    alert("Actualización masiva completada.");
  };

  return (
    <div className="space-y-6">
      {!hasApiKey() && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
          <KeyRound size={18} className="mt-0.5 flex-shrink-0" />
          <span>
            Para buscar precios reales en la web necesitas configurar tu API Key de Groq.
            Ve a <strong>Configuración</strong> en el menú lateral e ingrésala.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventario de Materiales</h2>
          <p className="text-gray-500 text-sm">Gestiona precios y proveedores en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpdateAll}
            disabled={isUpdatingAll || filteredMaterials.length === 0}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm border ${isUpdatingAll ? 'bg-gray-100 text-gray-400' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}
          >
            {isUpdatingAll ? <RefreshCw size={18} className="animate-spin" /> : <Globe size={18} />}
            {isUpdatingAll ? 'Actualizando...' : 'Actualizar Todo'}
          </button>
          <button
            onClick={onAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nuevo Material
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar material o proveedor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter size={20} className="text-gray-400 min-w-[20px]" />
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">Todas las Categorías</option>
            {Object.values(Category).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Material</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">Proveedor</th>
                <th className="px-6 py-4 font-semibold">Precio / Unidad</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{material.name}</div>
                    <div className="text-xs text-gray-400">Actualizado: {material.lastUpdated}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {material.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{material.supplier}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">${material.price.toLocaleString('es-CO')}</div>
                    <div className="text-xs text-gray-500 uppercase">{material.currency} / {material.unit}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {material.trend === 'up' && <span className="text-red-500 flex justify-center items-center gap-1 text-xs font-medium bg-red-50 py-1 px-2 rounded-full"><ArrowUp size={14} /> Sube</span>}
                    {material.trend === 'down' && <span className="text-green-500 flex justify-center items-center gap-1 text-xs font-medium bg-green-50 py-1 px-2 rounded-full"><ArrowDown size={14} /> Baja</span>}
                    {material.trend === 'stable' && <span className="text-gray-500 flex justify-center items-center gap-1 text-xs font-medium bg-gray-100 py-1 px-2 rounded-full"><Minus size={14} /> Estable</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {material.url && (
                        <a href={material.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver en tienda">
                          <ExternalLink size={18} />
                        </a>
                      )}
                      <button
                        onClick={() => handleAIUpdate(material)}
                        disabled={updatingId === material.id}
                        className={`p-2 rounded-lg flex items-center gap-1 ${updatingId === material.id ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}`}
                        title="Buscar precio real en web (Colombia)"
                      >
                        {updatingId === material.id ? <RefreshCw size={18} className="animate-spin" /> : <Globe size={18} />}
                      </button>
                      <button
                        onClick={() => onEdit(material)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron materiales con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialsView;
import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Material, Category, Unit } from '../types';
import { SUPPLIERS } from '../constants';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Partial<Material>) => void;
  initialData?: Material | null;
}

const MaterialModal: React.FC<MaterialModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    category: Category.CEMENTOS,
    supplier: SUPPLIERS[0],
    price: 0,
    unit: Unit.PIEZA,
    currency: 'COP',
    url: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        category: Category.CEMENTOS,
        supplier: SUPPLIERS[0],
        price: 0,
        unit: Unit.PIEZA,
        currency: 'COP',
        url: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">
            {initialData ? 'Editar Material' : 'Agregar Nuevo Material'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Material</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. Cemento Gris Argos 50kg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
              >
                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              >
                {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Actual (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input 
                  type="number" 
                  step="100"
                  required
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  placeholder="Ej. 38000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value as Unit})}
              >
                {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace del Producto (URL)</label>
            <div className="flex gap-2">
              <input 
                type="url" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                value={formData.url || ''}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://www.homecenter.com.co/..."
              />
              {formData.url && (
                <a 
                  href={formData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-shrink-0 px-3 py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all flex items-center justify-center"
                  title="Verificar precio en tienda"
                >
                  <ExternalLink size={20} />
                </a>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium shadow-md"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialModal;
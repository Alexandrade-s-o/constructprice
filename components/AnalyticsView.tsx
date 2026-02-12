import React from 'react';
import { Material } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface AnalyticsViewProps {
  materials: Material[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ materials }) => {
  // Prepare data for comparison chart (Top 5 most expensive)
  const barData = [...materials]
    .sort((a, b) => b.price - a.price)
    .slice(0, 5)
    .map(m => ({
      name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
      price: m.price,
      full: m.name
    }));

  // Mock historical data for aggregate view (Average Basket Price in COP)
  const lineData = [
    { name: 'Ago', avg: 38500 },
    { name: 'Sep', avg: 39200 },
    { name: 'Oct', avg: 38900 },
    { name: 'Nov', avg: 40500 },
    { name: 'Dic', avg: 41200 },
    { name: 'Ene', avg: 42000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Análisis de Precios (COP)</h2>
        <p className="text-gray-500 text-sm">Visualización de tendencias y comparativas del mercado colombiano.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Evolution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Tendencia Promedio de Mercado</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Precio Promedio']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1E2A38', fontWeight: 600 }}
                />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Canasta Básica Promedio (COP)" stroke="#F7931E" strokeWidth={3} dot={{ r: 4, fill: '#F7931E', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Materials Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Top Materiales por Costo Unitario</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 11}} interval={0} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip 
                   formatter={(value) => [`$${value}`, 'Precio']}
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="price" name="Precio (COP)" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1E2A38' : '#2C3E50'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Distribution Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Categorías</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(
                materials.reduce((acc, curr) => {
                    acc[curr.category] = (acc[curr.category] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            ).map(([cat, count]) => (
                <div key={cat} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Categoría</div>
                    <div className="font-semibold text-gray-800 truncate" title={cat}>{cat}</div>
                    <div className="text-2xl font-bold text-orange-500 mt-2">{count}</div>
                    <div className="text-xs text-gray-400">materiales</div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
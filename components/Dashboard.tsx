import React from 'react';
import { Material } from '../types';
import StatsCard from './StatsCard';
import { Package, TrendingUp, DollarSign, Activity, FileText, Loader2 } from 'lucide-react';
import { generateMarketReport } from '../services/aiService';

interface DashboardProps {
  materials: Material[];
}

const Dashboard: React.FC<DashboardProps> = ({ materials }) => {
  const totalMaterials = materials.length;
  const avgPrice = materials.reduce((acc, m) => acc + m.price, 0) / (totalMaterials || 1);
  const upTrendCount = materials.filter(m => m.trend === 'up').length;
  const [report, setReport] = React.useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = React.useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resumen General</h2>
        <p className="text-gray-500 text-sm">Bienvenido al panel de control de precios.</p>
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

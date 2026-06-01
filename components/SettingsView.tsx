import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ExternalLink, Save, Globe } from 'lucide-react';
import { getGroqKey, setGroqKey, getTavilyKey, setTavilyKey } from '../services/apiKey';
import { validateApiKey } from '../services/aiService';

type Status =
  | { type: 'idle' }
  | { type: 'saved' }
  | { type: 'validating' }
  | { type: 'valid' }
  | { type: 'invalid'; message: string };

const SettingsView: React.FC = () => {
  const [groq, setGroq] = useState(getGroqKey());
  const [tavily, setTavily] = useState(getTavilyKey());
  const [showGroq, setShowGroq] = useState(false);
  const [showTavily, setShowTavily] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  const persist = () => {
    setGroqKey(groq);
    setTavilyKey(tavily);
  };

  const handleSave = () => {
    persist();
    setStatus({ type: 'saved' });
  };

  const handleSaveAndTest = async () => {
    persist();
    if (!groq.trim()) {
      setStatus({ type: 'invalid', message: 'Ingresa tu API Key de Groq antes de probar.' });
      return;
    }
    setStatus({ type: 'validating' });
    const result = await validateApiKey(groq.trim());
    if (result.valid) setStatus({ type: 'valid' });
    else setStatus({ type: 'invalid', message: result.error || 'La clave no es válida.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="text-gray-500 text-sm">Conecta Groq (IA) y Tavily (búsqueda web) para precios reales.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl space-y-8">
        {/* ---- Groq ---- */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-lg">
              <KeyRound size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">API Key de Groq <span className="text-red-500">*</span></h3>
              <p className="text-xs text-gray-500">Modelo de IA. Obligatoria. Se guarda solo en este navegador.</p>
            </div>
          </div>
          <div className="relative">
            <input
              type={showGroq ? 'text' : 'password'}
              value={groq}
              onChange={(e) => { setGroq(e.target.value); setStatus({ type: 'idle' }); }}
              placeholder="gsk_..."
              className="w-full pl-4 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-mono text-sm"
            />
            <button type="button" onClick={() => setShowGroq((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showGroq ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-orange-600 hover:underline mt-2">
            Conseguir una API Key de Groq (gratis) <ExternalLink size={14} />
          </a>
        </div>

        {/* ---- Tavily ---- */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">API Key de Tavily</h3>
              <p className="text-xs text-gray-500">Búsqueda web en vivo (opcional). Sin ella, los precios son estimados.</p>
            </div>
          </div>
          <div className="relative">
            <input
              type={showTavily ? 'text' : 'password'}
              value={tavily}
              onChange={(e) => { setTavily(e.target.value); setStatus({ type: 'idle' }); }}
              placeholder="tvly-..."
              className="w-full pl-4 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
            />
            <button type="button" onClick={() => setShowTavily((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showTavily ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <a href="https://app.tavily.com/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2">
            Conseguir una API Key de Tavily (gratis, 1.000 búsquedas/mes) <ExternalLink size={14} />
          </a>
        </div>

        {/* ---- Estado ---- */}
        {status.type === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle2 size={16} /> Claves guardadas en este navegador.
          </div>
        )}
        {status.type === 'validating' && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Loader2 size={16} className="animate-spin" /> Validando con Groq...
          </div>
        )}
        {status.type === 'valid' && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle2 size={16} /> ¡Clave de Groq válida! Ya puedes usar la IA.
          </div>
        )}
        {status.type === 'invalid' && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <XCircle size={16} /> {status.message}
          </div>
        )}

        {/* ---- Acciones ---- */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleSaveAndTest} disabled={status.type === 'validating'}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
            {status.type === 'validating' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Guardar y probar
          </button>
          <button onClick={handleSave}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors">
            <Save size={18} /> Solo guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

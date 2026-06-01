import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ExternalLink, Save } from 'lucide-react';
import { getApiKey, setApiKey } from '../services/apiKey';
import { validateApiKey } from '../services/aiService';

type Status =
  | { type: 'idle' }
  | { type: 'saved' }
  | { type: 'validating' }
  | { type: 'valid' }
  | { type: 'invalid'; message: string };

const SettingsView: React.FC = () => {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  const handleSave = () => {
    setApiKey(key);
    setStatus({ type: 'saved' });
  };

  const handleSaveAndTest = async () => {
    setApiKey(key);
    if (!key.trim()) {
      setStatus({ type: 'invalid', message: 'Ingresa una API Key antes de probar.' });
      return;
    }
    setStatus({ type: 'validating' });
    const result = await validateApiKey(key.trim());
    if (result.valid) {
      setStatus({ type: 'valid' });
    } else {
      setStatus({ type: 'invalid', message: result.error || 'La clave no es válida.' });
    }
  };

  const handleClear = () => {
    setKey('');
    setApiKey('');
    setStatus({ type: 'idle' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="text-gray-500 text-sm">Conecta tu cuenta de Groq para buscar precios reales en la web.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-50 text-orange-600 p-2.5 rounded-lg">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">API Key de Groq</h3>
            <p className="text-xs text-gray-500">Se guarda solo en este navegador.</p>
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Tu clave</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setStatus({ type: 'idle' });
            }}
            placeholder="gsk_..."
            className="w-full pl-4 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title={show ? 'Ocultar' : 'Mostrar'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-orange-600 hover:underline mt-2"
        >
          Conseguir una API Key gratis <ExternalLink size={14} />
        </a>

        {/* Estado */}
        {status.type === 'saved' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle2 size={16} /> Clave guardada en este navegador.
          </div>
        )}
        {status.type === 'validating' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Loader2 size={16} className="animate-spin" /> Validando con Groq...
          </div>
        )}
        {status.type === 'valid' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle2 size={16} /> ¡Clave válida! Ya puedes buscar precios reales.
          </div>
        )}
        {status.type === 'invalid' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <XCircle size={16} /> {status.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            onClick={handleSaveAndTest}
            disabled={status.type === 'validating'}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            {status.type === 'validating' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Guardar y probar
          </button>
          <button
            onClick={handleSave}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Save size={18} /> Solo guardar
          </button>
          {key && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-red-600 px-2 py-2"
            >
              Borrar clave
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

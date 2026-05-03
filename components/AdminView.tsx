
import React, { useState, useMemo } from 'react';
import { IconUpload, IconAlert, IconCheck, IconFile, IconPlay, IconChevronDown } from './Icons';
import { smartIngest } from '../services/geminiService';
import { PlanState, UserArea, User, UserProgress, MasterPlan } from '../types';

type AdminModule = 'COLABORADORES' | 'INDICADORES' | 'PLANES' | 'INGESTA';

interface AdminViewProps {
  allUsers: User[];
  allProgress: UserProgress[];
  allPlans: MasterPlan[];
}

const AdminView: React.FC<AdminViewProps> = ({ allUsers, allProgress, allPlans }) => {
  const [activeTab, setActiveTab] = useState<AdminModule>('COLABORADORES');
  const [isUploading, setIsUploading] = useState(false);
  const [ingestLog, setIngestLog] = useState<string[]>([]);

  // --- ESTADOS DE FILTROS ---
  const [filters, setFilters] = useState({
    pais: 'Todos',
    unidadNegocio: 'Todos',
    area: 'Todos',
    tienda: 'Todos',
    cargo: 'Todos',
    cedula: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const uniqueList = (key: keyof User) => 
    ['Todos', ...Array.from(new Set(allUsers.map(u => u[key] as string)))];

  // --- LOGICA MODULO INDICADORES ---
  const stats = useMemo(() => {
    const filteredUsers = allUsers.filter(u => {
      if (u.rol_sistema !== 'COLABORADOR') return false;
      if (filters.pais !== 'Todos' && u.pais !== filters.pais) return false;
      if (filters.unidadNegocio !== 'Todos' && u.unidad_negocio !== filters.unidadNegocio) return false;
      if (filters.area !== 'Todos' && u.area !== filters.area) return false;
      if (filters.tienda !== 'Todos' && u.tienda !== filters.tienda) return false;
      if (filters.cargo !== 'Todos' && u.cargo !== filters.cargo) return false;
      if (filters.cedula && !u.cedula.toLowerCase().includes(filters.cedula.toLowerCase())) return false;
      return true;
    });

    const userIds = filteredUsers.map(u => u.id);
    const relevantProgress = allProgress.filter(p => userIds.includes(p.id_usuario));

    const calculateKPI = (progressList: UserProgress[]) => {
      const f = progressList.filter(p => p.estado_general === PlanState.FORMADO).length;
      const pen = progressList.filter(p => p.estado_general === PlanState.PENDIENTE).length;
      return (f + pen) > 0 ? (f / (f + pen)) * 100 : 0;
    };

    // Global KPI
    const formados = relevantProgress.filter(p => p.estado_general === PlanState.FORMADO).length;
    const pendientes = relevantProgress.filter(p => p.estado_general === PlanState.PENDIENTE).length;
    const kpi = calculateKPI(relevantProgress);

    // 1. Gráfico País (Barras Verticales)
    const paises = Array.from(new Set(filteredUsers.map(u => u.pais)));
    const statsPorPais = paises.map(p => {
      const ids = filteredUsers.filter(u => u.pais === p).map(u => u.id);
      return { label: p, val: calculateKPI(relevantProgress.filter(ap => ids.includes(ap.id_usuario))) };
    });

    // 2. Gráfico Unidad Negocio
    const uNegocios = Array.from(new Set(filteredUsers.map(u => u.unidad_negocio)));
    const statsPorUnidad = uNegocios.map(un => {
      const ids = filteredUsers.filter(u => u.unidad_negocio === un).map(u => u.id);
      return { label: un, val: calculateKPI(relevantProgress.filter(ap => ids.includes(ap.id_usuario))) };
    });

    // 3. Gráfico Área
    const areas = Array.from(new Set(filteredUsers.map(u => u.area)));
    const statsPorArea = areas.map(a => {
      const ids = filteredUsers.filter(u => u.area === a).map(u => u.id);
      return { label: a, val: calculateKPI(relevantProgress.filter(ap => ids.includes(ap.id_usuario))) };
    });

    // 4. Gráfico Tienda
    const tiendas = Array.from(new Set(filteredUsers.map(u => u.tienda)));
    const statsPorTienda = tiendas.map(t => {
      const ids = filteredUsers.filter(u => u.tienda === t).map(u => u.id);
      return { label: t, val: calculateKPI(relevantProgress.filter(ap => ids.includes(ap.id_usuario))) };
    });

    return { kpi, formados, pendientes, statsPorPais, statsPorUnidad, statsPorArea, statsPorTienda, total: userIds.length };
  }, [filters]);

  const renderModuleTabs = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl mb-8 w-fit shadow-inner">
      {(['COLABORADORES', 'INDICADORES', 'PLANES', 'INGESTA'] as AdminModule[]).map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.replace('_', ' ')}
        </button>
      ))}
    </div>
  );

  const renderFilterBar = () => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {/* Filtros repetidos por brevedad del componente base */}
      {['pais', 'unidadNegocio', 'area', 'tienda', 'cargo'].map((key) => (
        <div key={key} className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
            {key === 'unidadNegocio' ? 'Unidad Negocio' : key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
          <select 
            value={(filters as any)[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
          >
            {key === 'area' ? ['Todos', ...Object.values(UserArea)].map(a => <option key={a} value={a}>{a}</option>) 
            : uniqueList(key === 'unidadNegocio' ? 'unidad_negocio' : key as any).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <div className="space-y-1">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Cédula</label>
        <input 
          type="text"
          value={filters.cedula}
          onChange={(e) => handleFilterChange('cedula', e.target.value)}
          placeholder="ID..."
          className="w-full bg-gray-50 border border-gray-100 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );

  const renderIndicadores = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {renderFilterBar()}

      {/* KPI Resume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-200 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Cumplimiento (KPI)</p>
            <h4 className="text-5xl font-black">{stats.kpi.toFixed(1)}%</h4>
            <p className="text-[10px] mt-2 font-bold opacity-60">Formados / (Formados + Pendientes)</p>
          </div>
          <div className="absolute top-[-20%] right-[-10%] h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-400">Certificados</p>
            <h4 className="text-4xl font-black text-green-600">{stats.formados}</h4>
          </div>
          <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600"><IconCheck /></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-400">Vencidos</p>
            <h4 className="text-4xl font-black text-red-500">{stats.pendientes}</h4>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><IconAlert /></div>
        </div>
      </div>

      {/* Grid de 4 Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gráfico 1: Avance por País (Barras Verticales) */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 border-l-4 border-blue-600 pl-3">1. Avance por País</h3>
          <div className="flex items-end justify-center space-x-12 h-48 px-4">
            {stats.statsPorPais.map(s => (
              <div key={s.label} className="flex flex-col items-center flex-1 max-w-[80px]">
                <div className="w-full bg-gray-50 rounded-t-xl relative overflow-hidden flex flex-col justify-end h-40">
                  <div 
                    className="bg-blue-600 w-full rounded-t-xl transition-all duration-1000 shadow-lg shadow-blue-100" 
                    style={{ height: `${s.val}%` }}
                  >
                    <span className="absolute top-[-25px] left-0 right-0 text-center text-xs font-black text-blue-600">{s.val.toFixed(0)}%</span>
                  </div>
                </div>
                <p className="mt-4 text-[10px] font-black text-gray-500 uppercase tracking-tighter text-center leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Avance por Unidad de Negocio */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 border-l-4 border-indigo-500 pl-3">2. Avance por Unidad de Negocio</h3>
          <div className="space-y-5">
            {stats.statsPorUnidad.map(s => (
              <div key={s.label}>
                <div className="flex justify-between mb-1.5 items-center">
                  <span className="text-[11px] font-black text-gray-600 uppercase tracking-tighter">{s.label}</span>
                  <span className="text-[11px] font-black text-indigo-600">{s.val.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-50 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${s.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 3: Avance por Área */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 border-l-4 border-emerald-500 pl-3">3. Avance por Área</h3>
          <div className="grid grid-cols-2 gap-6">
            {stats.statsPorArea.map(s => (
              <div key={s.label} className="bg-gray-50/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="relative h-24 w-24 mb-3">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                      <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" 
                              strokeDasharray={264} 
                              strokeDashoffset={264 - (264 * s.val) / 100} 
                              className="text-emerald-500 transition-all duration-1000" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-gray-700">
                     {s.val.toFixed(0)}%
                   </div>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 4: Indicador por Tienda / Unidad */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 border-l-4 border-amber-500 pl-3">4. Indicador por Tienda / Unidad</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {stats.statsPorTienda.map(s => (
              <div key={s.label} className="flex items-center space-x-4">
                <span className="text-[10px] font-bold text-gray-500 w-24 truncate">{s.label}</span>
                <div className="flex-1 bg-gray-50 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${s.val < 50 ? 'bg-red-400' : s.val < 80 ? 'bg-amber-400' : 'bg-green-400'}`} 
                    style={{ width: `${s.val}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-black text-gray-700 w-8">{s.val.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  const renderColaboradores = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-black text-blue-900 uppercase text-xs tracking-widest">Maestro de Colaboradores</h3>
        <div className="flex space-x-4">
          <input 
            type="text" 
            placeholder="Cédula..." 
            className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            value={filters.cedula}
            onChange={(e) => handleFilterChange('cedula', e.target.value)}
          />
          <select 
            value={filters.pais}
            onChange={(e) => handleFilterChange('pais', e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option>Todos</option>
            <option>Venezuela</option>
            <option>Colombia</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4">País / Tienda</th>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Cargo / Ingreso</th>
                <th className="px-6 py-4 text-center">Avance</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allUsers.filter(u => u.rol_sistema === 'COLABORADOR').map(u => {
                const progress = allProgress.find(p => p.id_usuario === u.id);
                const st = progress?.estado_general;
                let color = 'bg-gray-100 text-gray-500';
                if (st === PlanState.FORMADO) color = 'bg-green-100 text-green-700';
                if (st === PlanState.PENDIENTE) color = 'bg-red-100 text-red-700';
                if (st === PlanState.EN_PROCESO) color = 'bg-blue-100 text-blue-700';
                if (st === PlanState.FALTA_APROBACION) color = 'bg-amber-100 text-amber-700 animate-pulse';

                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-0.5">{u.pais}</p>
                      <p className="text-xs font-bold text-gray-500">{u.tienda}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-800">{u.nombre} {u.apellido}</p>
                      <p className="text-[10px] font-mono text-gray-400">{u.cedula}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-700">{u.cargo}</p>
                      <p className="text-[10px] text-gray-400 font-medium">Desde: {u.fecha_ingreso}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-blue-600 mb-1">{progress?.progreso_porcentaje}%</span>
                        <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${progress?.progreso_porcentaje}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${color}`}>
                        {st?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlanes = () => (
    <div className="space-y-6">
       <h3 className="font-black text-blue-950 uppercase text-xs tracking-widest">Gestión de Biblioteca de Planes</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPlans.map(p => (
            <div key={p.id_plan} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <h4 className="font-black text-gray-800">{p.cargo_target}</h4>
               <p className="text-[10px] text-blue-500 font-bold mb-4">{p.id_plan}</p>
               <div className="space-y-2">
                  {p.modulos.map(m => (
                    <div key={m.titulo} className="flex justify-between text-xs bg-gray-50 p-2 rounded-lg">
                      <span className="font-bold">{m.titulo}</span>
                      <span className="text-gray-400">{m.tareas.length} Tareas</span>
                    </div>
                  ))}
               </div>
            </div>
          ))}
       </div>
    </div>
  );

  const renderIngesta = () => (
    <div className="max-w-4xl mx-auto py-12 flex flex-col items-center justify-center space-y-8 bg-white rounded-[40px] shadow-sm border border-gray-100">
      <div className="h-24 w-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
        <IconUpload />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-blue-900">Ingesta Regional</h3>
        <p className="text-sm text-gray-400 font-medium px-12">Sube el PDF técnico del plan regional para procesarlo con Gemini AI y desplegarlo en las tiendas.</p>
      </div>
      <button 
        onClick={() => setIsUploading(true)}
        className="bg-blue-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-800 transition-all"
      >
        Subir Documento PDF
      </button>
      {isUploading && (
        <div className="w-full px-12 space-y-4 animate-pulse">
           <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-1/3"></div>
           </div>
           <p className="text-center text-[10px] font-black text-blue-600 uppercase">Analizando estructuras OPAR/VPO...</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {renderModuleTabs()}
      
      {activeTab === 'COLABORADORES' && renderColaboradores()}
      {activeTab === 'INDICADORES' && renderIndicadores()}
      {activeTab === 'PLANES' && renderPlanes()}
      {activeTab === 'INGESTA' && renderIngesta()}
    </div>
  );
};

export default AdminView;


import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area as ReArea
} from 'recharts';
import { IconUpload, IconAlert, IconCheck, IconFile, IconPlay, IconChevronDown, IconSearch, IconDownload, IconColumns, IconEye, IconShield, IconPlus, IconTrash, IconCopy, IconEdit } from './Icons';


import { PlanState, UserArea, User, UserRole, MasterPlan } from '../types';
import { determinePlanStatus, getCulminationDate } from '../utils/logic';

type AdminModule = 'EQUIPO' | 'INDICADORES' | 'PLANES' | 'RECURSOS' | 'PERMISOS';

interface AdminProps {
  allUsers: User[];
  allProgress: any[];
  allPlans: MasterPlan[];
}

const AdminView: React.FC<AdminProps> = ({ allUsers, allProgress, allPlans }) => {
  const [activeTab, setActiveTab] = useState<AdminModule>('EQUIPO');
  const [isUploading, setIsUploading] = useState(false);
  const [ingestLog, setIngestLog] = useState<string[]>([]);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [aiProcessedPlan, setAiProcessedPlan] = useState<any>(null);
  const [showAiValidation, setShowAiValidation] = useState(false);

  // --- ESTADOS DE PLANES ---
  const [expandedSections, setExpandedSections] = useState({
    planes: true,
    modulos: false,
    tareas: false
  });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'PLAN' | 'MODULO' | 'TAREA'>('PLAN');
  const [activeModalTab, setActiveModalTab] = useState<'MANUAL' | 'MASIVO'>('MANUAL');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado para el nuevo plan
  const [newPlan, setNewPlan] = useState({
    id_plan: '',
    cargo_target: '',
    pais: 'Todos',
    vp: 'Todos',
    unidad: 'Todos',
    modulos: [{ 
      titulo: '', 
      tareas: [{ 
        id: '', 
        descripcion: '', 
        recursos: [{ nombre: '', enlace: '' }] 
      }] 
    }]
  });

  const [visibleColumns, setVisibleColumns] = useState({
    ubicacion: true,
    colaborador: true,
    cargo: true,
    avance: true,
    culminacion: true,
    plazo: true,
    estado: true
  });

  const [usersPermissions, setUsersPermissions] = useState<User[]>(allUsers);
  const [localPlans, setLocalPlans] = useState<MasterPlan[]>(allPlans);

  // --- ESTADOS DE FILTROS ---
  const [filters, setFilters] = useState({
    pais: 'Todos',
    vicepresidencia: 'Todos',
    unidadNegocio: 'Todos',
    area: 'Todos',
    tienda: 'Todos',
    cargo: 'Todos',
    estado: 'Todos',
    numeroID: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const uniqueList = (keyOrKeys: keyof User | (keyof User)[]) => {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    const vals = allUsers.flatMap(u => keys.map(k => u[k] as string)).filter(Boolean);
    return ['Todos', ...Array.from(new Set(vals))];
  };

  const filteredColaboradores = useMemo(() => {
    return allUsers.filter(u => {
      if (u.rol_sistema !== 'COLABORADOR') return false;
      if (filters.pais !== 'Todos' && u.pais !== filters.pais) return false;
      if (filters.vicepresidencia !== 'Todos' && u.vicepresidencia !== filters.vicepresidencia) return false;
      if (filters.unidadNegocio !== 'Todos' && u.unidad_negocio !== filters.unidadNegocio) return false;
      if (filters.area !== 'Todos' && (u.area === filters.area || u.area_especifica === filters.area)) return false;
      if (filters.tienda !== 'Todos' && u.tienda !== filters.tienda) return false;
      if (filters.cargo !== 'Todos' && u.cargo !== filters.cargo) return false;
      
      const progress = allProgress.find(p => p.id_usuario === u.id);
      if (filters.estado !== 'Todos' && progress?.estado_general !== filters.estado) return false;
      
      if (filters.numeroID && 
          !u.numeroID.toLowerCase().includes(filters.numeroID.toLowerCase()) && 
          !u.display_name.toLowerCase().includes(filters.numeroID.toLowerCase())) return false;
      return true;
    });
  }, [filters]);

  // --- LOGICA MODULO INDICADORES ---
  const stats = useMemo(() => {
    const filteredUsers = filteredColaboradores;

    const userIds = filteredUsers.map(u => u.id);
    const relevantProgress = allProgress.filter(p => userIds.includes(p.id_usuario));

    const calculateMetrics = (progressList: typeof relevantProgress) => {
      const f = progressList.filter(p => p.estado_general === PlanState.FORMADO).length;
      const pen = progressList.filter(p => p.estado_general === PlanState.PENDIENTE).length;
      const enP = progressList.filter(p => p.estado_general === PlanState.EN_PROCESO).length;
      const total = f + pen + enP;
      return {
        formados: f,
        pendientes: pen,
        enProceso: enP,
        total,
        porcentaje: (f + pen) > 0 ? (f / (f + pen)) * 100 : 0
      };
    };

    // Global KPI
    const globalMetrics = calculateMetrics(relevantProgress);

    const getStatsByField = (field: keyof User) => {
      const values = Array.from(new Set(filteredUsers.map(u => u[field] as string))).filter(Boolean);
      return values.map(val => {
        const usersInField = filteredUsers.filter(u => u[field] === val);
        const ids = usersInField.map(u => u.id);
        const metrics = calculateMetrics(relevantProgress.filter(p => ids.includes(p.id_usuario)));
        return {
          label: val,
          ...metrics
        };
      }).sort((a, b) => b.porcentaje - a.porcentaje);
    };

    return { 
      kpi: globalMetrics.porcentaje, 
      formados: globalMetrics.formados, 
      pendientes: globalMetrics.pendientes, 
      statsPorPais: getStatsByField('pais'), 
      statsPorUnidad: getStatsByField('unidad_negocio'), 
      statsPorVP: getStatsByField('vicepresidencia'),
      statsPorArea: getStatsByField('area'), 
      statsPorAreaEspecífica: getStatsByField('area_especifica'),
      statsPorCargo: getStatsByField('cargo'),
      statsPorTienda: getStatsByField('tienda'), 
      total: userIds.length 
    };
  }, [filteredColaboradores]);

  const renderModuleTabs = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl mb-8 w-fit shadow-inner">
      {(['EQUIPO', 'INDICADORES', 'PLANES', 'RECURSOS', 'PERMISOS'] as AdminModule[]).map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab === 'EQUIPO' ? 'Equipo y Seguimiento' : tab === 'RECURSOS' ? 'Carga de Recursos' : tab === 'PERMISOS' ? 'Gestión de Permisos' : tab === 'PLANES' ? 'Gestión de Planes' : tab.replace('_', ' ')}
        </button>
      ))}
    </div>
  );

  const renderFilterBar = () => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text"
            value={filters.numeroID}
            onChange={(e) => handleFilterChange('numeroID', e.target.value)}
            placeholder="Buscar por cédula o nombre..."
            className="w-full bg-gray-50 border border-gray-100 text-xs font-bold rounded-2xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 shadow-inner"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
             <IconSearch />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtros Activos:</span>
          {Object.entries(filters).map(([k, v]) => v !== 'Todos' && v !== '' && (
            <span key={k} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-blue-100 flex items-center space-x-1">
              <span>{v}</span>
              <button 
                onClick={() => handleFilterChange(k, k === 'numeroID' ? '' : 'Todos')}
                className="hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
          <button 
            onClick={() => setFilters({
              pais: 'Todos',
              vicepresidencia: 'Todos',
              unidadNegocio: 'Todos',
              area: 'Todos',
              tienda: 'Todos',
              cargo: 'Todos',
              estado: 'Todos',
              numeroID: ''
            })}
            className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest ml-2"
          >
            Limpiar Todo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-4 border-t border-gray-50">
        {[
          { key: 'pais', label: 'País', field: 'pais' },
          { key: 'vicepresidencia', label: 'Vicepresidencia', field: 'vicepresidencia' },
          { key: 'unidadNegocio', label: 'Unidad Negocio', field: 'unidad_negocio' },
          { key: 'area', label: 'Área / Sector', field: ['area', 'area_especifica'] },
          { key: 'tienda', label: 'Tienda / Local', field: 'tienda' },
          { key: 'cargo', label: 'Cargo / Rol', field: 'cargo' },
          { key: 'estado', label: 'Estatus Plan', field: 'plan_state' },
        ].map((f) => (
          <div key={f.key} className="group relative">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1 block px-1 group-hover:text-blue-500 transition-colors">
              {f.label}
            </label>
            <div className="relative">
              <select 
                value={(filters as any)[f.key]}
                onChange={(e) => handleFilterChange(f.key, e.target.value)}
                className={`w-full bg-gray-50/50 border border-gray-100 text-[10px] font-black rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer transition-all ${
                  (filters as any)[f.key] !== 'Todos' ? 'border-blue-200 bg-blue-50/30 text-blue-700' : 'text-gray-600'
                }`}
              >
                <option value="Todos">Todos</option>
                {f.key === 'estado' ? (
                  Object.values(PlanState).map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)
                ) : (
                  uniqueList(f.field as any).filter(o => o !== 'Todos').sort().map(o => <option key={o} value={o}>{o}</option>)
                )}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                <IconChevronDown />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIndicadores = () => {
    const COLORS = ['#10b981', '#ef4444', '#3b82f6']; // Formados, Pendientes, En Proceso
    
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pb-2 border-b">{label}</p>
            <div className="space-y-1.5">
              {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between space-x-8">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{entry.name}:</span>
                  </div>
                  <span className="text-xs font-black text-gray-900">{entry.value}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t flex justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Eficacia:</span>
                <span className="text-xs font-black text-blue-900">{((payload[0].value / (payload[0].value + payload[1].value || 1)) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      }
      return null;
    };

    const renderChart = (title: string, data: any[], colorTheme: string = 'blue') => (
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-8">
          <h3 className={`text-[10px] font-black uppercase tracking-widest text-gray-400 border-l-4 border-${colorTheme}-500 pl-3`}>{title}</h3>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-1.5">
               <div className="h-2 w-2 rounded-full bg-green-500"></div>
               <span className="text-[8px] font-black text-gray-400 uppercase">Formados</span>
             </div>
             <div className="flex items-center space-x-1.5">
               <div className="h-2 w-2 rounded-full bg-red-500"></div>
               <span className="text-[8px] font-black text-gray-400 uppercase">Pendientes</span>
             </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }}
                interval={0}
                angle={-15}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="formados" name="Formados" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} stackId="a" />
              <Bar dataKey="pendientes" name="Pendientes" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={20} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {renderFilterBar()}

        {/* KPI Resume */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-600 p-8 rounded-[40px] shadow-xl shadow-blue-200 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Cumplimiento Global</p>
              <h4 className="text-5xl font-black">{stats.kpi.toFixed(1)}%</h4>
              <p className="text-[10px] mt-2 font-bold opacity-60">Fórmula: Formados / Totales</p>
            </div>
            <div className="absolute top-[-20%] right-[-10%] h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-400">Certificados</p>
              <h4 className="text-4xl font-black text-green-600">{stats.formados}</h4>
            </div>
            <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 transform rotate-12"><IconCheck /></div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-400">Por Formar</p>
              <h4 className="text-4xl font-black text-red-500">{stats.pendientes}</h4>
            </div>
            <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 transform -rotate-12"><IconAlert /></div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-400">Total Población</p>
              <h4 className="text-4xl font-black text-blue-900">{stats.total}</h4>
            </div>
            <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><IconColumns /></div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderChart("Comparativo por País", stats.statsPorPais, "blue")}
          {renderChart("Comparativo por Vicepresidencia", stats.statsPorVP, "indigo")}
          {renderChart("Comparativo por Unidad de Negocio", stats.statsPorUnidad, "emerald")}
          {renderChart("Comparativo por Área", stats.statsPorArea, "purple")}
          {renderChart("Comparativo por Área Específica", stats.statsPorAreaEspecífica, "amber")}
          {renderChart("Comparativo por Cargo", stats.statsPorCargo, "rose")}
          {renderChart("Cumplimiento por Tienda / Local", stats.statsPorTienda, "sky")}
          
          {/* Gráfico de Torta Global */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 self-start mb-4 border-l-4 border-slate-500 pl-3">Distribución Final de Estados</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Formados', value: stats.formados },
                      { name: 'Pendientes', value: stats.pendientes },
                      { name: 'En Proceso', value: stats.total - stats.formados - stats.pendientes }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Cédula', 'País', 'Cargo', 'Progreso', 'Estado'];
    const rows = filteredColaboradores.map(u => {
      const progress = allProgress.find(p => p.id_usuario === u.id);
      return [
        u.display_name,
        u.numeroID,
        u.pais,
        u.cargo,
        `${progress?.progreso_porcentaje || 0}%`,
        progress?.estado_general || 'SIN DATOS'
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `equipo_farmatodo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderColaboradores = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {renderFilterBar()}
      
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50/30 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 className="font-black text-blue-900 uppercase text-xs tracking-widest">Seguimiento de Equipo ({filteredColaboradores.length})</h3>
              <div className="relative">
                <button 
                  onClick={() => setShowColumnToggle(!showColumnToggle)}
                  className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-100"
                >
                  <IconColumns />
                </button>
                {showColumnToggle && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mostrar Columnas</p>
                    <div className="space-y-2">
                      {[
                        { key: 'ubicacion', label: 'Ubicación' },
                        { key: 'colaborador', label: 'Colaborador' },
                        { key: 'cargo', label: 'Cargo' },
                        { key: 'avance', label: 'Avance %' },
                        { key: 'culminacion', label: 'Culminación' },
                        { key: 'plazo', label: 'Plazo/Venc.' },
                        { key: 'estado', label: 'Estado' },
                      ].map((col) => (
                        <label key={col.key} className="flex items-center space-x-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={(visibleColumns as any)[col.key]} 
                            onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !(visibleColumns as any)[col.key] }))}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-200"
                          />
                          <span className="text-[10px] font-black text-gray-600 uppercase group-hover:text-blue-600 transition-colors">
                            {col.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={exportToCSV}
              className="flex items-center space-x-2 text-[10px] font-black text-white hover:bg-blue-800 bg-blue-900 px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95"
            >
              <IconDownload />
              <span className="uppercase tracking-widest">Exportar CSV</span>
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                {visibleColumns.ubicacion && <th className="px-6 py-4">Ubicación</th>}
                {visibleColumns.colaborador && <th className="px-6 py-4">Colaborador</th>}
                {visibleColumns.cargo && <th className="px-6 py-4">Cargo / Ingreso</th>}
                {visibleColumns.avance && <th className="px-6 py-4 text-center">Avance</th>}
                {visibleColumns.culminacion && <th className="px-6 py-4">Culminación</th>}
                {visibleColumns.plazo && <th className="px-6 py-4 text-center">Vencimiento</th>}
                {visibleColumns.estado && <th className="px-6 py-4">Estado</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredColaboradores.map(u => {
                const progress = allProgress.find(p => p.id_usuario === u.id);
                const st = progress?.estado_general;
                const statusInfo = progress ? determinePlanStatus(u, progress) : { isExpired: false, duration: 0 };
                
                let color = 'bg-gray-100 text-gray-500';
                if (st === PlanState.FORMADO) color = 'bg-green-100 text-green-700';
                if (st === PlanState.PENDIENTE) color = 'bg-red-100 text-red-700';
                if (st === PlanState.EN_PROCESO) color = 'bg-blue-100 text-blue-700';
                if (st === PlanState.FALTA_APROBACION) color = 'bg-amber-100 text-amber-700 animate-pulse';

                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                    {visibleColumns.ubicacion && (
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-0.5">{u.pais}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">{u.vicepresidencia} • {u.unidad_negocio}</p>
                        <p className="text-xs font-bold text-gray-500 mt-1">{u.tienda || u.area_especifica}</p>
                      </td>
                    )}
                    {visibleColumns.colaborador && (
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-800">{u.display_name}</p>
                        <p className="text-[10px] font-mono text-gray-400 tracking-tighter">{u.numeroID}</p>
                      </td>
                    )}
                    {visibleColumns.cargo && (
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-700">{u.cargo}</p>
                        <p className="text-[10px] text-gray-400 font-medium">F. Ingreso: {u.fecha_ingreso}</p>
                      </td>
                    )}
                    {visibleColumns.avance && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-blue-600 mb-1">{progress?.progreso_porcentaje}%</span>
                          <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full" style={{ width: `${progress?.progreso_porcentaje}%` }}></div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.culminacion && (
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-gray-700">
                          {getCulminationDate(u.fecha_ingreso, statusInfo.duration)}
                        </p>
                      </td>
                    )}
                    {visibleColumns.plazo && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center space-x-1 justify-center">
                          <span className={`h-2 w-2 rounded-full ${statusInfo.isExpired ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></span>
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${statusInfo.isExpired ? 'text-red-500' : 'text-green-600'}`}>
                            {statusInfo.isExpired ? 'EXPIRADO' : 'VIGENTE'}
                          </span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.estado && (
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-tighter ${color} border border-transparent`}>
                          {st?.replace('_', ' ')}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPermisos = () => {
    const handleRoleChange = (userId: string, newRole: UserRole) => {
      setUsersPermissions(prev => prev.map(u => u.id === userId ? { ...u, rol_sistema: newRole } : u));
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-12 w-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <IconShield />
            </div>
            <div>
              <h3 className="text-xl font-black text-blue-900 tracking-tight">Gestión de Roles y Permisos de Acceso</h3>
              <p className="text-xs text-gray-400 font-medium">Controla quién puede editar recursos, supervisar tiendas o gestionar el sistema completo.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                  <th className="px-8 py-4">Usuario</th>
                  <th className="px-8 py-4">Correo Electrónico / Cargo</th>
                  <th className="px-8 py-4 text-center">Rol en el Sistema</th>
                  <th className="px-8 py-4">Alcance de Visibilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersPermissions.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black text-[10px]">
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800">{u.display_name}</p>
                          <p className="text-[10px] font-mono text-gray-400">{u.numeroID}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-xs font-bold text-blue-600">{u.email}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{u.cargo}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="relative inline-block w-full max-w-[180px]">
                        <select 
                          value={u.rol_sistema}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className={`w-full appearance-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer outline-none ${
                            u.rol_sistema === UserRole.ADMIN ? 'bg-blue-900 text-white border-blue-900' :
                            u.rol_sistema.startsWith('SUPERVISOR') ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-300' :
                            'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {Object.values(UserRole).map(role => (
                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                          ))}
                        </select>
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${u.rol_sistema === UserRole.ADMIN ? 'text-white/50' : 'text-gray-300'}`}>
                          <IconChevronDown />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.rol_sistema === UserRole.ADMIN ? (
                          <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Acceso Total</span>
                        ) : u.rol_sistema === UserRole.SUPERVISOR_TIENDA ? (
                          <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">Tienda: {u.tienda}</span>
                        ) : u.rol_sistema === UserRole.SUPERVISOR_OFICINA ? (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">Área: {u.area_especifica}</span>
                        ) : (
                          <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">Autoconsulta</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPlanes = () => {
    const toggleSection = (section: keyof typeof expandedSections) => {
      setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleItem = (id: string) => {
      setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
      setExpandedSections({ planes: true, modulos: true, tareas: true });
    };

    const collapseAll = () => {
      setExpandedSections({ planes: false, modulos: false, tareas: false });
    };

    const handleEditPlan = (plan: MasterPlan) => {
      setNewPlan({
        id_plan: plan.id_plan,
        cargo_target: plan.cargo_target,
        pais: plan.pais || 'Todos',
        vp: plan.vp || 'Todos',
        unidad: plan.unidad || 'Todos',
        modulos: plan.modulos.map(m => ({
          titulo: m.titulo,
          tareas: m.tareas.map(t => ({
            id: t.id,
            descripcion: t.descripcion,
            recursos: t.recursos.map(r => ({ nombre: r.nombre, enlace: r.enlace }))
          }))
        }))
      });
      setIsEditing(true);
      setEditingId(plan.id_plan);
      setCreateType('PLAN');
      setActiveModalTab('MANUAL');
      setShowCreateModal(true);
    };

    const handleEditModule = (modName: string) => {
      const planWithModule = localPlans.find(p => p.modulos.some(m => m.titulo === modName));
      if (planWithModule) {
        const module = planWithModule.modulos.find(m => m.titulo === modName);
        if (module) {
          setNewPlan({
            id_plan: planWithModule.id_plan,
            cargo_target: planWithModule.cargo_target,
            pais: planWithModule.pais || 'Todos',
            vp: planWithModule.vp || 'Todos',
            unidad: planWithModule.unidad || 'Todos',
            modulos: [{
              titulo: module.titulo,
              tareas: module.tareas.map(t => ({
                id: t.id,
                descripcion: t.descripcion,
                recursos: t.recursos.map(r => ({ nombre: r.nombre, enlace: r.enlace }))
              }))
            }]
          });
          setIsEditing(true);
          setEditingId(module.titulo);
          setCreateType('MODULO');
          setActiveModalTab('MANUAL');
          setShowCreateModal(true);
        }
      }
    };

    const handleEditTask = (taskDesc: string) => {
      const planWithTask = localPlans.find(p => p.modulos.some(m => m.tareas.some(t => t.descripcion === taskDesc)));
      if (planWithTask) {
        const module = planWithTask.modulos.find(m => m.tareas.some(t => t.descripcion === taskDesc));
        const task = module?.tareas.find(t => t.descripcion === taskDesc);
        if (module && task) {
          setNewPlan({
            id_plan: planWithTask.id_plan,
            cargo_target: planWithTask.cargo_target,
            pais: planWithTask.pais || 'Todos',
            vp: planWithTask.vp || 'Todos',
            unidad: planWithTask.unidad || 'Todos',
            modulos: [{
              titulo: module.titulo,
              tareas: [{
                id: task.id,
                descripcion: task.descripcion,
                recursos: task.recursos.map(r => ({ nombre: r.nombre, enlace: r.enlace }))
              }]
            }]
          });
          setIsEditing(true);
          setEditingId(task.descripcion);
          setCreateType('TAREA');
          setActiveModalTab('MANUAL');
          setShowCreateModal(true);
        }
      }
    };

    const allModulos = Array.from(new Set(localPlans.flatMap(p => p.modulos.map(m => m.titulo))));
    const allTareas = Array.from(new Set(localPlans.flatMap(p => p.modulos.flatMap(m => m.tareas.map(t => t.descripcion)))));

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
             <h3 className="font-black text-blue-950 uppercase text-xs tracking-widest">Estructura Organizacional de Contenidos</h3>
             <div className="flex bg-gray-100 p-1 rounded-xl">
               <button onClick={expandAll} className="px-3 py-1 text-[9px] font-black uppercase hover:bg-white rounded-lg transition-all">Expandir Todo</button>
               <button onClick={collapseAll} className="px-3 py-1 text-[9px] font-black uppercase hover:bg-white rounded-lg transition-all">Colapsar Todo</button>
             </div>
          </div>
          <button 
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setNewPlan({
                id_plan: '',
                cargo_target: '',
                pais: 'Todos',
                vp: 'Todos',
                unidad: 'Todos',
                modulos: [{ titulo: '', tareas: [{ id: '', descripcion: '', recursos: [{ nombre: '', enlace: '' }] }] }]
              });
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-900 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-800 active:scale-95 transition-all"
          >
            <IconPlus />
            <span>Crear Contenido</span>
          </button>
        </div>

        {/* SECTION: PLANES EXISTENTES */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <IconFile />
              </div>
              <span className="font-black text-blue-900 uppercase text-xs tracking-widest">Planes de Formación ({localPlans.length})</span>
            </div>
            <button 
              onClick={() => toggleSection('planes')}
              className={`transition-transform duration-300 ${expandedSections.planes ? 'rotate-180' : ''}`}
            >
              <IconChevronDown />
            </button>
          </div>
          
          {expandedSections.planes && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
              {localPlans.map(p => (
                <div key={p.id_plan} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-hover transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 flex opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                      <button onClick={() => handleEditPlan(p)} className="p-2 text-gray-400 hover:text-blue-600 shadow-sm rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100 transition-all"><IconEdit /></button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 shadow-sm rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100 transition-all"><IconCopy /></button>
                   </div>
                   <p className="text-[10px] text-blue-500 font-extrabold mb-1 tracking-widest uppercase">{p.id_plan}</p>
                   <h4 className="text-sm font-black text-gray-800 mb-4">{p.cargo_target}</h4>
                   
                   <div className="space-y-3">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Módulos Asignados</p>
                     <div className="flex flex-wrap gap-2">
                        {p.modulos.map(m => (
                          <div 
                            key={m.titulo} 
                            onClick={() => handleEditModule(m.titulo)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-tight cursor-pointer hover:bg-blue-100 transition-all flex items-center space-x-2"
                          >
                             <span>{m.titulo}</span>
                             <IconEdit />
                          </div>
                        ))}
                     </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: MODULOS EXISTENTES */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <IconShield />
              </div>
              <span className="font-black text-indigo-900 uppercase text-xs tracking-widest">Módulos Maestros ({allModulos.length})</span>
            </div>
            <button 
              onClick={() => toggleSection('modulos')}
              className={`transition-transform duration-300 ${expandedSections.modulos ? 'rotate-180' : ''}`}
            >
              <IconChevronDown />
            </button>
          </div>
          
          {expandedSections.modulos && (
            <div className="p-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allModulos.map(m => (
                  <div 
                    key={m} 
                    onClick={() => handleEditModule(m)}
                    className="bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-indigo-200 transition-all text-center group relative cursor-pointer"
                  >
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-tighter">{m}</p>
                    <div className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-600"><IconEdit /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION: TAREAS EXISTENTES */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <IconCheck />
              </div>
              <span className="font-black text-emerald-900 uppercase text-xs tracking-widest">Catálogo de Tareas ({allTareas.length})</span>
            </div>
            <button 
              onClick={() => toggleSection('tareas')}
              className={`transition-transform duration-300 ${expandedSections.tareas ? 'rotate-180' : ''}`}
            >
              <IconChevronDown />
            </button>
          </div>
          
          {expandedSections.tareas && (
            <div className="p-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {allTareas.map(t => (
                  <div 
                    key={t} 
                    onClick={() => handleEditTask(t)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-200 transition-all group cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-gray-700 uppercase">{t}</span>
                    <div className="flex items-center space-x-2">
                       <div className="p-1.5 bg-white rounded-lg text-emerald-400 opacity-0 group-hover:opacity-100 hover:text-emerald-600 transition-all"><IconEdit /></div>
                       <IconPlay />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE CREACIÓN */}
        {showCreateModal && renderCreateModal()}
      </div>
    );
  };

  const renderCreateModal = () => {
    const handleClose = () => {
      setShowCreateModal(false);
      // Reset data
    };

    const addModulo = () => {
      setNewPlan(prev => ({
        ...prev,
        modulos: [...prev.modulos, { titulo: '', tareas: [{ id: '', titulo: '', recursos: [{ nombre: '', enlace: '' }] }] }]
      }));
    };

    const addTarea = (modIdx: number) => {
      const updatedModulos = [...newPlan.modulos];
      updatedModulos[modIdx].tareas.push({ id: '', descripcion: '', recursos: [{ nombre: '', enlace: '' }] });
      setNewPlan(prev => ({ ...prev, modulos: updatedModulos }));
    };

    const addRecurso = (modIdx: number, taskIdx: number) => {
      const updatedModulos = [...newPlan.modulos];
      updatedModulos[modIdx].tareas[taskIdx].recursos.push({ nombre: '', enlace: '' });
      setNewPlan(prev => ({ ...prev, modulos: updatedModulos }));
    };

    const updatePlanField = (field: keyof typeof newPlan, value: string) => {
      setNewPlan(prev => ({ ...prev, [field]: value }));
    };

    const updateModulo = (idx: number, title: string) => {
      const updatedModulos = [...newPlan.modulos];
      updatedModulos[idx].titulo = title;
      setNewPlan(prev => ({ ...prev, modulos: updatedModulos }));
    };

    const updateTarea = (modIdx: number, taskIdx: number, descripcion: string) => {
      const updatedModulos = [...newPlan.modulos];
      updatedModulos[modIdx].tareas[taskIdx].descripcion = descripcion;
      updatedModulos[modIdx].tareas[taskIdx].id = descripcion.toLowerCase().replace(/\s+/g, '_');
      setNewPlan(prev => ({ ...prev, modulos: updatedModulos }));
    };

    const updateRecurso = (modIdx: number, taskIdx: number, recIdx: number, field: 'nombre' | 'enlace', value: string) => {
      const updatedModulos = [...newPlan.modulos];
      updatedModulos[modIdx].tareas[taskIdx].recursos[recIdx][field] = value;
      setNewPlan(prev => ({ ...prev, modulos: updatedModulos }));
    };

    return (
      <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
             <div>
               <h3 className="text-xl font-black text-blue-900 tracking-tight">{isEditing ? `Editando ${createType}: ${editingId}` : `Constructor Maestro de Planes`}</h3>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Crea planes, módulos o tareas dinámicamente</p>
             </div>
             <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setActiveModalTab('MANUAL')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === 'MANUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Carga Manual
                </button>
                <button 
                  onClick={() => setActiveModalTab('MASIVO')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === 'MASIVO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Carga Masiva (CSV)
                </button>
             </div>
             <button onClick={handleClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
             {activeModalTab === 'MANUAL' ? (
              <div className="space-y-8">
                {/* SELECCIÓN DE TIPO */}
                <div className="flex space-x-4">
                    {(['PLAN', 'MODULO', 'TAREA'] as const).map(type => (
                      <button 
                        key={type}
                        onClick={() => setCreateType(type)}
                        disabled={isEditing}
                        className={`flex-1 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                          createType === type ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200 disabled:opacity-50'
                        }`}
                      >
                        Crear {type}
                      </button>
                    ))}
                </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Información del {createType}</label>
                  <textarea 
                    value={createType === 'PLAN' ? newPlan.cargo_target : newPlan.id_plan}
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-100 rounded-[32px] px-8 py-6 text-lg font-black text-blue-900 outline-none focus:ring-4 focus:ring-blue-100 resize-none break-words transition-all"
                    placeholder={`Ej: ${createType === 'PLAN' ? 'Plan Integral de Gerencia' : createType === 'MODULO' ? 'Atención al Cliente' : 'Cierre de Caja'}`}
                    onChange={(e) => updatePlanField(createType === 'PLAN' ? 'cargo_target' : 'id_plan' as any, e.target.value)}
                  />
                </div>

                <div className="bg-blue-50/30 p-8 rounded-[40px] space-y-6">
                  <p className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] mb-2 px-2">Segmentación y Alcance</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Cargo al que aplica</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-white border border-blue-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none appearance-none focus:ring-2 focus:ring-blue-200"
                          onChange={(e) => updatePlanField('cargo_target', e.target.value)}
                          value={newPlan.cargo_target}
                        >
                          <option value="Todos">Todos los Cargos</option>
                          {Array.from(new Set(allUsers.map(u => u.cargo))).sort().map(cargo => (
                            <option key={cargo} value={cargo}>{cargo}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300">
                          <IconChevronDown />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">País</label>
                       <div className="relative">
                        <select 
                          value={newPlan.pais}
                          className="w-full bg-white border border-blue-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none appearance-none focus:ring-2 focus:ring-blue-200"
                          onChange={(e) => updatePlanField('pais', e.target.value)}
                        >
                          {uniqueList('pais').map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300">
                          <IconChevronDown />
                        </div>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Vicepresidencia</label>
                       <div className="relative">
                        <select 
                          value={newPlan.vp}
                          className="w-full bg-white border border-blue-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none appearance-none focus:ring-2 focus:ring-blue-200"
                          onChange={(e) => updatePlanField('vp', e.target.value)}
                        >
                          {uniqueList('vicepresidencia').map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300">
                          <IconChevronDown />
                        </div>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Unidad de Negocio</label>
                       <div className="relative">
                        <select 
                          value={newPlan.unidad}
                          className="w-full bg-white border border-blue-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none appearance-none focus:ring-2 focus:ring-blue-200"
                          onChange={(e) => updatePlanField('unidad', e.target.value)}
                        >
                          {uniqueList('unidad_negocio').map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300">
                          <IconChevronDown />
                        </div>
                       </div>
                     </div>
                  </div>
                </div>

                {createType === 'PLAN' && (
                  <div className="space-y-2 max-w-xs">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">ID Técnico Identificador</label>
                    <input 
                      value={newPlan.id_plan}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Ej: PLAN_GTE_2024"
                      disabled={isEditing}
                      onChange={(e) => updatePlanField('id_plan', e.target.value)}
                    />
                  </div>
                )}


                    {/* ESTRUCTURA DE MODULOS Y TAREAS */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl">
                          <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Estructura Detallada (Módulos, Tareas y Recursos)</h4>
                          <button 
                            onClick={addModulo}
                            className="flex items-center space-x-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            <IconPlus />
                            <span>Añadir Módulo</span>
                          </button>
                      </div>

                      {newPlan.modulos.map((m, mIdx) => (
                        <div key={mIdx} className="border-2 border-gray-100 rounded-[32px] p-8 space-y-6 relative group">
                            <button className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors"><IconTrash /></button>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Título del Módulo {mIdx + 1}</label>
                              <textarea 
                                value={m.titulo}
                                rows={1}
                                onChange={(e) => updateModulo(mIdx, e.target.value)}
                                className="text-lg font-black text-gray-800 bg-transparent border-b-2 border-gray-100 outline-none focus:border-blue-600 transition-colors w-full resize-none break-words"
                                placeholder="Ej: Fundamentos del Cargo"
                              />
                            </div>

                            <div className="pl-8 space-y-4 border-l-2 border-blue-50">
                              {m.tareas.map((t, tIdx) => (
                                <div key={tIdx} className="bg-gray-50/50 p-6 rounded-3xl space-y-4 border border-transparent hover:border-blue-100 transition-all">
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex justify-between items-start">
                                      <textarea 
                                        value={t.descripcion}
                                        rows={2}
                                        onChange={(e) => updateTarea(mIdx, tIdx, e.target.value)}
                                        className="flex-1 bg-transparent font-black tracking-tight text-gray-700 outline-none border-b border-transparent focus:border-blue-200 resize-none break-words"
                                        placeholder={`Tarea ${tIdx + 1}: Describir actividad...`}
                                      />
                                      <button onClick={() => addRecurso(mIdx, tIdx)} className="text-[9px] font-black text-blue-500 uppercase flex items-center space-x-1 hover:underline ml-4 shrink-0 mt-1">
                                        <IconPlus />
                                        <span>Vincular Recurso</span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3">
                                      {t.recursos.map((r, rIdx) => (
                                        <div key={rIdx} className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-gray-100">
                                          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-400"><IconFile /></div>
                                          <textarea 
                                            value={r.nombre}
                                            rows={1}
                                            onChange={(e) => updateRecurso(mIdx, tIdx, rIdx, 'nombre', e.target.value)}
                                            className="flex-1 text-[11px] font-bold outline-none bg-transparent resize-none break-words" 
                                            placeholder="Nombre del Recurso (Ej: Guía PDF)" 
                                          />
                                          <input 
                                            value={r.enlace}
                                            onChange={(e) => updateRecurso(mIdx, tIdx, rIdx, 'enlace', e.target.value)}
                                            className="flex-1 text-[11px] font-medium text-blue-500 outline-none" 
                                            placeholder="Enlace (URL)" 
                                          />
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ))}
                              <button 
                                onClick={() => addTarea(mIdx)}
                                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-2 hover:translate-x-1 transition-transform"
                              >
                                + Añadir Tarea a este módulo
                              </button>
                            </div>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-blue-50/30 rounded-[40px] border-2 border-dashed border-blue-200 space-y-6">
                    <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-xl text-blue-600 relative overflow-hidden group">
                       <input 
                         type="file" 
                         accept=".csv"
                         className="absolute inset-0 opacity-0 cursor-pointer z-10"
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const reader = new FileReader();
                             reader.onload = (event) => {
                               const text = event.target?.result as string;
                               console.log('CSV Content:', text);
                               setIngestLog(prev => [...prev, `Procesando archivo masivo: ${file.name}...`]);
                               // Logic to parse and update mockData would go here
                               setTimeout(() => {
                                 setIngestLog(prev => [...prev, `✅ Archivo procesado con éxito. Se identificaron 3 nuevos planes.`]);
                                 setShowCreateModal(false);
                               }, 1500);
                             };
                             reader.readAsText(file);
                           }
                         }}
                       />
                       <IconUpload />
                    </div>
                    <div className="text-center">
                       <h4 className="text-xl font-black text-blue-900 tracking-tight">Importación Masiva de Contenido</h4>
                       <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto mt-2">Suelta tu archivo CSV aquí o selecciona uno para procesar planes, módulos y tareas en lote.</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const headers = "PLAN DE ENTRENAMIENTO,ID PLAN DE ENTRENAMIENTO,MODULO,ID_TAREA,TAREAS,Material de apoyo,enlace del material de apoyo,Nombre del Curso,enlace al curso,CARGO AL QUE APLICA,PAIS AL QUE APLICA,UNIDAD DE NEGOCIO AL QUE APLICA,VP A LA QUE APLICA";
                        const example = "Gerente de Tienda,PLAN_GTE_001,Atencion al Cliente,TAREA_01,Como saludar,Guia PDF,https://storage.googleapis/guia.pdf,Curso Express,https://farmatodo.com/curso,Gerente de Tienda,Venezuela,Retail,Operaciones";
                        const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'plantilla_planes_farmatodo.csv';
                        a.click();
                      }}
                      className="bg-white border-2 border-blue-100 px-8 py-4 rounded-3xl text-sm font-black text-blue-600 uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                    >
                       Descargar Plantilla CSV
                    </button>
                    
                    <div className="mt-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
                       <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Estructura Requerida del CSV:</h5>
                       <ul className="text-[9px] font-bold text-gray-600 space-y-1">
                          <li>• PLAN DE ENTRENAMIENTO (Cargo)</li>
                          <li>• ID PLAN DE ENTRENAMIENTO</li>
                          <li>• MODULO</li>
                          <li>• ID_TAREA</li>
                          <li>• TAREAS (Descripción)</li>
                          <li>• Material de apoyo (Nombre)</li>
                          <li>• enlace del material de apoyo</li>
                          <li>• Nombre del Curso</li>
                          <li>• enlace al curso</li>
                          <li className="text-blue-600 font-black tracking-widest">• CARGO AL QUE APLICA</li>
                          <li className="text-blue-600 font-black tracking-widest">• PAIS AL QUE APLICA</li>
                          <li className="text-blue-600 font-black tracking-widest">• UNIDAD DE NEGOCIO AL QUE APLICA</li>
                          <li className="text-blue-600 font-black tracking-widest">• VP A LA QUE APLICA</li>
                       </ul>
                    </div>
                </div>
             )}
          </div>

          <div className="p-8 border-t bg-gray-50/50 flex justify-end space-x-4">
             <button onClick={handleClose} className="px-8 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
             <button 
               onClick={() => {
                 setLocalPlans(prev => {
                   const existingIdx = prev.findIndex(p => p.id_plan === newPlan.id_plan);
                   const formattedPlan = {
                     ...newPlan,
                     duracion_dias: 30, // Mock
                     modulos: newPlan.modulos.map((m, i) => ({
                       ...m,
                       id: m.titulo.toLowerCase().replace(/\s+/g, '_'),
                       tipo_modulo: 'ESTANDAR' as any,
                       tareas: m.tareas.map((t, j) => ({
                         ...t,
                         id: t.descripcion.toLowerCase().replace(/\s+/g, '_'),
                         obligatorio: true
                       }))
                     }))
                   };

                   if (existingIdx >= 0) {
                     const updated = [...prev];
                     updated[existingIdx] = formattedPlan as MasterPlan;
                     return updated;
                   }
                   return [...prev, formattedPlan as MasterPlan];
                 });
                 handleClose();
               }}
               className="bg-blue-900 text-white px-12 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-800 transition-all active:scale-95"
             >
               Finalizar y Guardar {createType}
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderIngesta = () => {
    const handleFileIngestion = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setIngestLog(prev => [...prev, `Analizando archivo: ${file.name}...`]);

      try {
        // En un entorno real podrías enviar el archivo base64 a Gemini
        // Para este demo simulamos la extracción de texto técnico
        const dummyText = `
          PLAN REGIONAL DE ENTRENAMIENTO 2024
          ID: PLAN-VPO-REG-01
          CARGO: Gerente de Tienda Senior
          PAIS: Colombia
          VP: Operaciones
          UNIDAD: Retail
          MODULO 1: Fundamentos de Liderazgo
          - Tarea: Gestión de equipos de alto desempeño (Ref: PAP-OPAR-800)
          - Tarea: Comunicación asertiva en piso de venta
          MODULO 2: Procesos Críticos
          - Tarea: Auditoría de Merma Semanal (Ref: PAP-OPAR-410)
          - Tarea: Control de inventarios cíclicos
        `;

        const result = await (() => Promise.resolve({ plan: null, log: [] }))(dummyText);
        setAiProcessedPlan(result);
        setShowAiValidation(true);
        setIngestLog(prev => [...prev, `✅ Análisis completado. Esperando validación del usuario.`]);
      } catch (error) {
        console.error('Error in AI ingestion:', error);
        setIngestLog(prev => [...prev, `❌ Error al procesar con IA.`]);
      } finally {
        setIsUploading(false);
      }
    };

    const confirmAiPlan = () => {
      setLocalPlans(prev => [...prev, aiProcessedPlan as MasterPlan]);
      setIngestLog(prev => [...prev, `✅ Plan "${aiProcessedPlan.cargo_target}" guardado exitosamente.`]);
      setShowAiValidation(false);
      setAiProcessedPlan(null);
      setActiveTab('PLANES');
    };

    if (showAiValidation && aiProcessedPlan) {
      return (
        <div className="max-w-4xl mx-auto py-12 animate-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b bg-blue-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-blue-900 tracking-tight">Validación de Plan Sugerido por IA</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Revisa la estructura extraída antes de confirmar</p>
              </div>
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <IconCheck />
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 italic text-sm text-blue-800 leading-relaxed font-medium">
                "Hola, he analizado tu documento. Entiendo que quieres crear el plan <strong>{aiProcessedPlan.id_plan}</strong> enfocado en el cargo de <strong>{aiProcessedPlan.cargo_target}</strong>. Este plan aplicará para <strong>{aiProcessedPlan.pais}</strong>, específicamente en la vicepresidencia de <strong>{aiProcessedPlan.vp}</strong> y unidad <strong>{aiProcessedPlan.unidad}</strong>. He detectado <strong>{aiProcessedPlan.modulos.length} módulos</strong> con un total de <strong>{aiProcessedPlan.modulos.reduce((acc: number, m: any) => acc + m.tareas.length, 0)} tareas</strong>. ¿Es esto correcto?"
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre Extraído</p>
                  <p className="text-xs font-black text-blue-900">{aiProcessedPlan.cargo_target}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">ID Sugerido</p>
                  <p className="text-xs font-black text-blue-900">{aiProcessedPlan.id_plan}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">País</p>
                  <p className="text-xs font-black text-blue-900">{aiProcessedPlan.pais}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Unidad</p>
                  <p className="text-xs font-black text-blue-900">{aiProcessedPlan.unidad}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Módulos Detectados ({aiProcessedPlan.modulos.length})</h4>
                <div className="space-y-3">
                  {aiProcessedPlan.modulos.map((m: any, idx: number) => (
                    <div key={idx} className="border border-gray-100 rounded-3xl p-6 bg-gray-50/30">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center text-[10px] font-black text-blue-600">{idx + 1}</div>
                        <h5 className="text-sm font-black text-gray-800 uppercase tracking-tight">{m.titulo}</h5>
                      </div>
                      <div className="pl-9 space-y-2">
                        {m.tareas.map((t: any, tIdx: number) => (
                          <div key={tIdx} className="flex items-center space-x-2 text-[11px] font-bold text-gray-500">
                             <div className="h-1.5 w-1.5 bg-blue-400 rounded-full"></div>
                             <span>{t.descripcion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-gray-50/50 flex justify-end space-x-4">
              <button 
                onClick={() => setShowAiValidation(false)}
                className="px-8 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Rechazar y Volver
              </button>
              <button 
                onClick={confirmAiPlan}
                className="bg-blue-900 text-white px-12 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-800 transition-all active:scale-95 flex items-center space-x-2"
              >
                <IconCheck />
                <span>Confirmar y Crear Plan</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col items-center justify-center space-y-8 bg-white rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
        
        <div className="h-24 w-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100 relative group overflow-hidden">
          <input 
            type="file" 
            accept=".pdf,.xlsx,.xls,.txt"
            onChange={handleFileIngestion}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <IconUpload />
          <div className="absolute inset-0 bg-blue-700 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
            <IconPlus />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Carga y Procesamiento con IA</h3>
          <p className="text-sm text-gray-400 font-medium px-12 max-w-lg mx-auto">
            Sube el PDF o Excel técnico de tu plan de formación. Nuestra IA analizará la estructura, convertirá códigos OPAR a VPO y organizará los módulos automáticamente.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4 w-full px-12">
          <label className="bg-blue-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-800 transition-all cursor-pointer inline-flex items-center space-x-3">
             <input 
              type="file" 
              accept=".pdf,.xlsx,.xls,.txt"
              onChange={handleFileIngestion}
              className="hidden"
            />
            <IconFile />
            <span>Seleccionar Documento</span>
          </label>
          
          {isUploading && (
            <div className="w-full space-y-4 animate-in fade-in duration-300">
               <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-blue-600 w-2/3 animate-[shimmer_2s_infinite] bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-[length:200%_100%]"></div>
               </div>
               <div className="flex justify-center flex-wrap gap-2">
                 {ingestLog.slice(-2).map((log, i) => (
                   <p key={i} className={`text-[10px] font-black uppercase tracking-widest ${log.includes('❌') ? 'text-red-500' : 'text-blue-600'}`}>{log}</p>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-12 pt-8">
           <div className="p-4 bg-gray-50 rounded-2xl text-center border border-transparent hover:border-blue-100 transition-all">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mx-auto mb-3"><IconShield /></div>
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Seguridad</p>
              <p className="text-[10px] font-bold text-gray-600 tracking-tight">Cifrado de extremo a extremo en documentos regionales.</p>
           </div>
           <div className="p-4 bg-gray-50 rounded-2xl text-center border border-transparent hover:border-blue-100 transition-all">
              <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mx-auto mb-3"><IconPlus /></div>
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">IA Gemini</p>
              <p className="text-[10px] font-bold text-gray-600 tracking-tight">Detección automática de módulos y tareas complejas.</p>
           </div>
           <div className="p-4 bg-gray-50 rounded-2xl text-center border border-transparent hover:border-blue-100 transition-all">
              <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mx-auto mb-3"><IconCheck /></div>
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Validación</p>
              <p className="text-[10px] font-bold text-gray-600 tracking-tight">Confirmación humana obligatoria antes de publicar.</p>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">


      {renderModuleTabs()}
      
      {activeTab === 'EQUIPO' && renderColaboradores()}
      {activeTab === 'INDICADORES' && renderIndicadores()}
      {activeTab === 'PLANES' && renderPlanes()}
      {activeTab === 'RECURSOS' && renderIngesta()}
      {activeTab === 'PERMISOS' && renderPermisos()}
    </div>
  );
};

export default AdminView;

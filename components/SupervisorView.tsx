
import React, { useState, useMemo } from 'react';
import { User, UserProgress, Evaluation, MasterPlan, Resource, ResourceType, PlanState } from '../types';
import { IconCheck, IconAlert, IconChevronDown, IconFile, IconPlay, IconSearch, IconFilter, IconCalendar } from './Icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getCulminationDate, getRemainingDays } from '../utils/logic';

interface Props {
  supervisor: User;
  allUsers: User[];
  allProgress: UserProgress[];
  plan: MasterPlan;
  resources: Resource[];
  onUpdateProgress: (progress: UserProgress) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const SupervisorView: React.FC<Props> = ({ supervisor, allUsers, allProgress, plan, resources, onUpdateProgress }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'PROGRESO' | 'COMPETENCIAS'>('PROGRESO');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (title: string) => {
    setExpandedModules(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleApprovePlan = (progress: UserProgress) => {
    if (progress.progreso_porcentaje < 100) return;
    
    onUpdateProgress({
      ...progress,
      estado_general: PlanState.FORMADO,
      ultima_actividad: new Date().toISOString()
    });
    setSelectedUser(null);
  };
  
  // States for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    unidad_negocio: '',
    area: '',
    area_especifica: '',
    tienda: '',
    estado: ''
  });

  // Filtrar colaboradores que pertenecen a la misma tienda o reportan al supervisor (o según permisos)
  const baseTeam = useMemo(() => {
    // In a real app, this would be scoped by backend. 
    // Here we show those related to the supervisor's store or unit if they are higher level.
    if (supervisor.rol_sistema === 'ADMIN') return allUsers;
    return allUsers.filter(u => 
      u.id_supervisor === supervisor.id || 
      (u.tienda === supervisor.tienda && u.tienda !== '') ||
      (u.unidad_negocio === supervisor.unidad_negocio && u.tienda === '')
    );
  }, [allUsers, supervisor]);

  // Apply filters to the team
  const filteredTeam = useMemo(() => {
    return baseTeam.filter(u => {
      const progress = allProgress.find(p => p.id_usuario === u.id);
      
      const matchSearch = u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.numeroID.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchUnidad = !filters.unidad_negocio || u.unidad_negocio === filters.unidad_negocio;
      const matchArea = !filters.area || u.area === filters.area;
      const matchAreaEsp = !filters.area_especifica || u.area_especifica === filters.area_especifica;
      const matchTienda = !filters.tienda || u.tienda === filters.tienda;
      
      let matchEstado = true;
      if (filters.estado === 'VENCIDO') {
        matchEstado = progress?.estado_general === PlanState.PENDIENTE;
      } else if (filters.estado === 'PENDIENTE') {
        matchEstado = progress?.estado_general === PlanState.EN_PROCESO;
      } else if (filters.estado) {
        matchEstado = progress?.estado_general === filters.estado;
      }

      return matchSearch && matchUnidad && matchArea && matchAreaEsp && matchTienda && matchEstado;
    });
  }, [baseTeam, allProgress, searchTerm, filters]);

  // Metrics for Charts
  const chartData = useMemo(() => {
    const stats = filteredTeam.reduce((acc, u) => {
      const progress = allProgress.find(p => p.id_usuario === u.id);
      const state = progress?.estado_general || PlanState.PENDIENTE;
      acc[state] = (acc[state] || 0) + 1;
      acc.totalProgress += (progress?.progreso_porcentaje || 0);
      return acc;
    }, { totalProgress: 0 } as any);

    const averageProgress = filteredTeam.length > 0 ? Math.round(stats.totalProgress / filteredTeam.length) : 0;

    const pieData = [
      { name: 'Formado', value: stats[PlanState.FORMADO] || 0, color: '#10b981' },
      { name: 'En Proceso', value: stats[PlanState.EN_PROCESO] || 0, color: '#3b82f6' },
      { name: 'Vencido', value: stats[PlanState.PENDIENTE] || 0, color: '#ef4444' },
      { name: 'Falta Aprob.', value: stats[PlanState.FALTA_APROBACION] || 0, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    return { pieData, averageProgress };
  }, [filteredTeam, allProgress]);

  // Options for filter selects
  const filterOptions = useMemo(() => {
    return {
      unidades: Array.from(new Set(baseTeam.map(u => u.unidad_negocio))).filter(Boolean),
      areas: Array.from(new Set(baseTeam.map(u => u.area))).filter(Boolean),
      areasEsp: Array.from(new Set(baseTeam.map(u => u.area_especifica))).filter(Boolean),
      tiendas: Array.from(new Set(baseTeam.map(u => u.tienda))).filter(Boolean),
    };
  }, [baseTeam]);

  // Get current evaluations for selected user
  const currentProgress = useMemo(() => {
    if (!selectedUser) return null;
    return allProgress.find(p => p.id_usuario === selectedUser.id) || null;
  }, [selectedUser, allProgress]);

  // Categorized Competencies logic
  const defaultEvaluations: Record<string, Evaluation[]> = {
    "IMPULSANDO A FARMATODO": [
      { competencia: 'Pasión por el Cliente (Conductas de Servicio)', resultado: 'LOGRADO', feedback: '' },
      { competencia: 'Embajador de Marca (Imagen y Uniforme)', resultado: 'LOGRADO', feedback: '' }
    ],
    "GENERANDO RESULTADOS": [
      { competencia: 'Orientación a Resultados Excelentes (Indicadores)', resultado: 'LOGRADO', feedback: '' },
      { competencia: 'Excelencia Operativa (Procesos PAP)', resultado: 'A_MEJORAR', feedback: 'Reforzar conocimiento en procesos de Merma.' }
    ],
    "LA EXCELENCIA (ACTITUDINAL)": [
      { competencia: 'Sentido de Urgencia', resultado: 'LOGRADO', feedback: '' },
      { competencia: 'Preocupación por el Orden y Calidad', resultado: 'LOGRADO', feedback: '' },
      { competencia: 'Madurez Emocional y Resiliencia', resultado: 'LOGRADO', feedback: '' },
      { competencia: 'Energía y Entusiasmo', resultado: 'LOGRADO', feedback: '' }
    ],
    "CAPACIDAD Y CONTROL": [
      { competencia: 'Capacidad de Aprendizaje (Academia)', resultado: 'LOGRADO', feedback: '' },
      { competencia: 'Alcanzando Seguimiento y Control 2', resultado: 'A_MEJORAR', feedback: 'Mejorar el reporte diario de fallas.' }
    ],
    "VALORES": [
      { competencia: 'Ética e Integridad', resultado: 'LOGRADO', feedback: '' },
      { competencia: 'Trabajo en Equipo', resultado: 'LOGRADO', feedback: '' }
    ]
  };

  const [evaluations, setEvaluations] = useState<Record<string, Evaluation[]>>(defaultEvaluations);

  // Sync evaluations when user is selected
  React.useEffect(() => {
    if (currentProgress && currentProgress.evaluaciones.length > 0) {
      // If user has evaluations, we could map them back to categories, 
      // but for this POC we'll just use the ones already in state or update them
      // For simplicity in POC, we'll just keep the local state but we should save it
    }
  }, [currentProgress]);

  const saveEvaluations = (newEvals: Record<string, Evaluation[]>) => {
    if (!currentProgress) return;
    const flatEvals = Object.values(newEvals).flat();
    onUpdateProgress({
      ...currentProgress,
      evaluaciones: flatEvals,
      ultima_actividad: new Date().toISOString()
    });
  };

  const updateResult = (category: string, index: number, result: 'LOGRADO' | 'A_MEJORAR') => {
    const newEvals = { ...evaluations };
    newEvals[category][index].resultado = result;
    setEvaluations(newEvals);
    saveEvaluations(newEvals);
  };

  const updateFeedback = (category: string, index: number, text: string) => {
    const newEvals = { ...evaluations };
    newEvals[category][index].feedback = text;
    setEvaluations(newEvals);
    saveEvaluations(newEvals);
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Target Progress Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Avance Promedio Tienda/Unidad</h4>
        <div className="relative h-32 w-32 flex items-center justify-center">
           <svg className="h-full w-full rotate-[-90deg]">
              <circle
                cx="64" cy="64" r="58"
                fill="transparent"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              <circle
                cx="64" cy="64" r="58"
                fill="transparent"
                stroke="#312e81"
                strokeWidth="8"
                strokeDasharray={364.42}
                strokeDashoffset={364.42 - (364.42 * chartData.averageProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-indigo-900">{chartData.averageProgress}%</span>
           </div>
        </div>
        <p className="mt-4 text-[10px] font-bold text-gray-500 text-center px-4">
          Meta alcanzada de formación técnica en el equipo actual.
        </p>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Estado del Equipo</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-bold text-gray-500 uppercase">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderFiltersList = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 sticky top-0 z-10">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o número ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none font-medium"
          />
        </div>

        {/* Desktop Filter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <select 
            value={filters.unidad_negocio}
            onChange={(e) => setFilters(f => ({ ...f, unidad_negocio: e.target.value }))}
            className="bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-tight px-3 py-2 outline-none focus:border-blue-400 transition-all"
          >
            <option value="">Unidad</option>
            {filterOptions.unidades.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          <select 
            value={filters.area}
            onChange={(e) => setFilters(f => ({ ...f, area: e.target.value }))}
            className="bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-tight px-3 py-2 outline-none focus:border-blue-400 transition-all"
          >
            <option value="">Área Gral</option>
            {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select 
            value={filters.area_especifica}
            onChange={(e) => setFilters(f => ({ ...f, area_especifica: e.target.value }))}
            className="bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-tight px-3 py-2 outline-none focus:border-blue-400 transition-all"
          >
            <option value="">Área Esp.</option>
            {filterOptions.areasEsp.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select 
            value={filters.tienda}
            onChange={(e) => setFilters(f => ({ ...f, tienda: e.target.value }))}
            className="bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-tight px-3 py-2 outline-none focus:border-blue-400 transition-all"
          >
            <option value="">Tienda</option>
            {filterOptions.tiendas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            value={filters.estado}
            onChange={(e) => setFilters(f => ({ ...f, estado: e.target.value }))}
            className="bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-tight px-3 py-2 outline-none focus:border-blue-400 transition-all"
          >
            <option value="">Estatus</option>
            <option value="PENDIENTE">PENDIENTES</option>
            <option value="VENCIDO">VENCIDOS</option>
            <option value={PlanState.FORMADO}>FORMADO</option>
            <option value={PlanState.FALTA_APROBACION}>POR APROBAR</option>
          </select>

          <button 
            onClick={() => {
              setFilters({ unidad_negocio: '', area: '', area_especifica: '', tienda: '', estado: '' });
              setSearchTerm('');
            }}
            className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );

  const renderTeamList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {renderDashboard()}
      {renderFiltersList()}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white text-xs font-black uppercase tracking-widest">
            {filteredTeam.length} Colaboradores encontrados
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4">ID / Cédula</th>
                <th className="px-6 py-4">Nombre y Apellido</th>
                <th className="px-6 py-4">Cargo / Unidad</th>
                <th className="px-6 py-4 text-center">Avance</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeam.map(u => {
                const progress = allProgress.find(p => p.id_usuario === u.id);
                const st = progress?.estado_general;
                let statusColor = 'bg-gray-100 text-gray-500';
                if (st === PlanState.FORMADO) statusColor = 'bg-green-100 text-green-700';
                if (st === PlanState.PENDIENTE) statusColor = 'bg-red-100 text-red-700';
                if (st === PlanState.EN_PROCESO) statusColor = 'bg-blue-100 text-blue-700';
                if (st === PlanState.FALTA_APROBACION) statusColor = 'bg-amber-100 text-amber-700 animate-pulse';

                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{u.numeroID}</td>
                    <td className="px-6 py-4 text-sm font-black text-gray-800">{u.display_name}</td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-bold text-gray-600 leading-none">{u.cargo}</p>
                       <p className="text-[10px] text-gray-400 mt-1">{u.unidad_negocio} {u.tienda && `• ${u.tienda}`}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-blue-600 mb-1">{progress?.progreso_porcentaje}%</span>
                        <div className="w-16 bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${progress?.progreso_porcentaje}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${statusColor}`}>
                        {st?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <IconAlert />
                    <p className="text-sm font-medium mt-2">No se encontraron colaboradores con los filtros seleccionados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedUser) return null;
    const progress = allProgress.find(p => p.id_usuario === selectedUser.id)!;
    const culminationDate = getCulminationDate(selectedUser.fecha_ingreso, plan.duracion_dias);
    const remainingDays = getRemainingDays(selectedUser.fecha_ingreso, plan.duracion_dias);

    const st = progress.estado_general;
    let statusColor = 'bg-gray-100 text-gray-500 border-gray-200';
    if (st === PlanState.FORMADO) statusColor = 'bg-green-50 text-green-700 border-green-200';
    if (st === PlanState.PENDIENTE) statusColor = 'bg-red-50 text-red-700 border-red-200';
    if (st === PlanState.EN_PROCESO) statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
    if (st === PlanState.FALTA_APROBACION) statusColor = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <button 
          onClick={() => setSelectedUser(null)}
          className="group flex items-center space-x-4 bg-white border-2 border-blue-100 px-10 py-5 rounded-[2rem] text-blue-800 font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-xl hover:shadow-blue-200 w-fit active:scale-95"
        >
          <span className="group-hover:-translate-x-2 transition-transform text-xl">←</span>
          <span>Volver al listado del equipo</span>
        </button>

        {/* Collaborator Profile Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col xl:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl shadow-inner">
              {selectedUser.nombre.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-xl font-black text-gray-800 tracking-tight">{selectedUser.display_name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${statusColor}`}>
                  {st?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{selectedUser.cargo} • ID: {selectedUser.numeroID}</p>
            </div>
          </div>

          {/* Execution Timeline */}
          <div className="flex flex-1 items-center justify-around w-full max-w-xl bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
            <div className="text-center px-4 border-r border-gray-200">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">F. Inicio</p>
              <div className="flex items-center justify-center space-x-1.5">
                <IconCalendar />
                <span className="text-xs font-bold text-gray-700">{selectedUser.fecha_ingreso}</span>
              </div>
            </div>
            
            <div className="text-center px-4 border-r border-gray-200">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Culminación (Plazo)</p>
              <div className="flex items-center justify-center space-x-1.5 text-indigo-700">
                <IconCalendar />
                <span className="text-xs font-black">{culminationDate}</span>
              </div>
            </div>

            <div className="text-center px-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tiempo Restante</p>
              <p className={`text-sm font-black ${remainingDays < 5 ? 'text-red-500' : 'text-blue-600'}`}>
                {remainingDays > 0 ? `${remainingDays} Días` : 'Plazo Vencido'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avance Actual</p>
            <div className="flex items-center space-x-3">
               <div className="text-right">
                  <p className="text-lg font-black text-blue-600 leading-none">{progress.progreso_porcentaje}%</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Técnico</p>
               </div>
               <div className="h-10 w-1 bg-gray-100 rounded-full"></div>
               <div className="text-right">
                  <p className="text-lg font-black text-green-600 leading-none">
                    {progress.evaluaciones.filter(e => e.resultado === 'LOGRADO').length}/{progress.evaluaciones.length || 12}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Competencias</p>
               </div>
            </div>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('PROGRESO')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'PROGRESO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Progreso del Plan
          </button>
          <button 
            onClick={() => setActiveTab('COMPETENCIAS')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'COMPETENCIAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Evaluación Competencias
          </button>
        </div>

        {activeTab === 'PROGRESO' ? (
          <div className="space-y-4">
            {plan.modulos.map((module) => {
              const completedInModule = module.tareas.filter(t => progress.checks_completados.includes(t.recurso_ref)).length;
              const progressPct = Math.round((completedInModule / module.tareas.length) * 100);
              const isExpanded = expandedModules[module.titulo];

              return (
                <div key={module.titulo} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => toggleModule(module.titulo)}
                    className="w-full p-4 flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-gray-800">{module.titulo}</h3>
                      <span className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                        {completedInModule} / {module.tareas.length} Tareas
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${progressPct}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-gray-500">{progressPct}%</span>
                      </div>
                      <div className={`${isExpanded ? 'rotate-180' : ''} transition-transform text-gray-400`}>
                        <IconChevronDown />
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {module.tareas.map((task, idx) => {
                          const isDone = progress.checks_completados.includes(task.recurso_ref);
                          return (
                            <div key={idx} className={`p-3 rounded-lg border flex items-center space-x-3 ${isDone ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {isDone && <IconCheck />}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight ${isDone ? 'text-green-800' : 'text-gray-600'}`}>
                                {task.descripcion}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Approval Button Footer */}
            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center">
              <div className="relative group">
                <button 
                  disabled={progress.progreso_porcentaje < 100}
                  onClick={() => handleApprovePlan(progress)}
                  className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all transform active:scale-95 ${
                    progress.progreso_porcentaje >= 100 
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white hover:shadow-indigo-200 hover:-translate-y-1' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  Certificar y Finalizar Plan
                </button>
                {progress.progreso_porcentaje < 100 && (
                  <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max text-[9px] font-black text-red-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    Requiere el 100% de progreso técnico
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(evaluations) as [string, Evaluation[]][]).map(([category, items]) => (
              <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-blue-900 px-6 py-3 flex justify-between items-center">
                  <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">{category}</h3>
                  <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Modelo APV Senior</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                        <th className="px-6 py-4 w-1/3">Habilidades y Conductas</th>
                        <th className="px-6 py-4 text-center">Evaluación</th>
                        <th className="px-6 py-4">Evidencias y Plan de Mejora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((ev, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{ev.competencia}</p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center space-x-3">
                              <button 
                                onClick={() => updateResult(category, idx, 'LOGRADO')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                  ev.resultado === 'LOGRADO' 
                                    ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600'
                                }`}
                              >
                                Logrado
                              </button>
                              <button 
                                onClick={() => updateResult(category, idx, 'A_MEJORAR')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                  ev.resultado === 'A_MEJORAR' 
                                    ? 'bg-red-500 border-red-500 text-white shadow-sm' 
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-600'
                                }`}
                              >
                                A Mejorar
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <textarea 
                              value={ev.feedback}
                              onChange={(e) => updateFeedback(category, idx, e.target.value)}
                              placeholder={ev.resultado === 'A_MEJORAR' ? "Especifique el plan de refuerzo..." : "Comentarios del supervisor..."}
                              className={`w-full p-3 text-xs border rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none min-h-[60px] ${
                                ev.resultado === 'A_MEJORAR' && !ev.feedback 
                                  ? 'border-red-200 bg-red-50/30' 
                                  : 'border-gray-100 bg-gray-50/30'
                              }`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back button at the bottom */}
        <div className="flex justify-center pt-12 pb-8">
          <button 
            onClick={() => setSelectedUser(null)}
            className="group flex items-center space-x-4 bg-white border-2 border-blue-100 px-12 py-6 rounded-[2.5rem] text-blue-900 font-black text-sm uppercase tracking-widest hover:bg-blue-950 hover:text-white hover:border-blue-950 transition-all shadow-[0_20px_50px_rgba(30,58,138,0.15)] active:scale-95"
          >
            <span className="group-hover:-translate-x-2 transition-transform text-xl">←</span>
            <span>Volver al listado del equipo</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {!selectedUser ? renderTeamList() : renderDetail()}
    </div>
  );
};

export default SupervisorView;


import React, { useState, useMemo } from 'react';
import { User, UserProgress, Evaluation, MasterPlan, Resource, ResourceType, PlanState } from '../types';
import { IconCheck, IconAlert, IconChevronDown, IconFile, IconPlay } from './Icons';

interface Props {
  supervisor: User;
  allUsers: User[];
  allProgress: UserProgress[];
  plan: MasterPlan;
  resources: Resource[];
  onUpdateProgress: (progress: UserProgress) => void;
}

const SupervisorView: React.FC<Props> = ({ supervisor, allUsers, allProgress, plan, resources, onUpdateProgress }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'PROGRESO' | 'COMPETENCIAS'>('PROGRESO');
  
  // Filtrar colaboradores que pertenecen a la misma tienda o reportan al supervisor
  const team = useMemo(() => {
    return allUsers.filter(u => u.id_supervisor === supervisor.id || (u.tienda === supervisor.tienda && u.id !== supervisor.id));
  }, [allUsers, supervisor]);

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

  const renderTeamList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-900 px-6 py-4">
          <h3 className="text-white text-xs font-black uppercase tracking-widest">Colaboradores en {supervisor.tienda}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4">Cédula</th>
                <th className="px-6 py-4">Nombre y Apellido</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4 text-center">Avance</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {team.map(u => {
                const progress = allProgress.find(p => p.id_usuario === u.id);
                const st = progress?.estado_general;
                let statusColor = 'bg-gray-100 text-gray-500';
                if (st === PlanState.FORMADO) statusColor = 'bg-green-100 text-green-700';
                if (st === PlanState.PENDIENTE) statusColor = 'bg-red-100 text-red-700';
                if (st === PlanState.EN_PROCESO) statusColor = 'bg-blue-100 text-blue-700';
                if (st === PlanState.FALTA_APROBACION) statusColor = 'bg-amber-100 text-amber-700 animate-pulse';

                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{u.cedula}</td>
                    <td className="px-6 py-4 text-sm font-black text-gray-800">{u.nombre} {u.apellido}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{u.cargo}</td>
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
              {team.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-400 text-sm font-medium">No hay colaboradores asignados a esta tienda.</p>
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

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <button 
          onClick={() => setSelectedUser(null)}
          className="flex items-center space-x-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
        >
          <span>← Volver al equipo</span>
        </button>

        {/* Collaborator Profile Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl">
              {selectedUser.nombre.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">{selectedUser.nombre} {selectedUser.apellido}</h2>
              <p className="text-sm text-gray-500 font-medium">{selectedUser.cargo} • ID: {selectedUser.cedula}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estatus de Formación (90 Días)</p>
            <div className="flex items-center space-x-3">
               <div className="text-right">
                  <p className="text-lg font-black text-blue-600 leading-none">{progress.progreso_porcentaje}%</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Progreso Técnico</p>
               </div>
               <div className="h-10 w-1 bg-gray-100 rounded-full"></div>
               <div className="text-right">
                  <p className="text-lg font-black text-green-600 leading-none">10/12</p>
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

              return (
                <div key={module.titulo} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-gray-800">{module.titulo}</h3>
                      <span className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                        {completedInModule} / {module.tareas.length} Tareas
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${progressPct}%` }}></div>
                      </div>
                      <span className="text-xs font-black text-gray-500">{progressPct}%</span>
                    </div>
                  </div>
                  <div className="p-4">
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
                </div>
              );
            })}
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

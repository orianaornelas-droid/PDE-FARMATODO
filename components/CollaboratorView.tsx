
import React, { useState } from 'react';
import { User, MasterPlan, UserProgress, ResourceType, Resource, Instruccion } from '../types';
import { IconFile, IconPlay, IconLink, IconCheck, IconChevronDown, IconAlert } from './Icons';
import { calculateTrafficLight, getRemainingDays } from '../utils/logic';
import CompetencyHouse from './CompetencyHouse';

interface Props {
  user: User;
  plan: MasterPlan;
  progress: UserProgress;
  resources: Resource[];
  instrucciones?: Instruccion[];
  onCheckTask: (resourceId: string) => void;
}

const CollaboratorView: React.FC<Props> = ({ user, plan, progress, resources, instrucciones, onCheckTask }) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ 'Plan de Inducción': true });
  const [activeTab, setActiveTab] = useState<'CONOCIMIENTOS' | 'COMPETENCIAS'>('CONOCIMIENTOS');

  const toggleModule = (title: string) => {
    setExpandedModules(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getResourceIcon = (type?: ResourceType) => {
    switch (type) {
      case ResourceType.VIDEO: return <IconPlay />;
      case ResourceType.ENCUESTA: return <IconLink />;
      default: return <IconFile />;
    }
  };

  const status = calculateTrafficLight(progress, plan);
  const statusColors = {
    RED: 'bg-red-500',
    YELLOW: 'bg-yellow-500',
    GREEN: 'bg-green-500'
  };

  const remaining = getRemainingDays(progress.fecha_inicio, plan.duracion_dias);

  const defaultInstructions = [
    "El supervisor inmediato y el colaborador nuevo ingreso son responsables de la adecuada ejecución del Plan de Entrenamiento.",
    "El supervisor asignado para explicar cada proceso, enseña y demuestra de manera práctica el mismo. El colaborador nuevo ingreso ejecuta lo aprendido.",
    "El supervisor inmediato y el colaborador nuevo ingreso deben hacer seguimiento al plan de entrenamiento y certificar el cumplimiento y entendimiento de los procesos marcando \"Check\" en la columna de estatus.",
    "El colaborador nuevo ingreso es responsable de realizar las formaciones de la Academia Farmatodo que corresponden a cada semana del entrenamiento."
  ];

  const displayedInstructions = instrucciones && instrucciones.length > 0 
    ? instrucciones.map(i => `${i.titulo}: ${i.contenido}`)
    : defaultInstructions;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header Profile - DATOS DEL COLABORADOR */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-900 px-6 py-2">
          <h2 className="text-white text-[10px] font-black uppercase tracking-widest">Datos del Colaborador Nuevo Ingreso</h2>
        </div>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-6">
            <div className="h-20 w-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl shadow-inner">
              {user.nombre.charAt(0)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Nombre y Apellido</p>
                <h1 className="text-lg font-bold text-gray-800 leading-tight">{user.nombre}</h1>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Cédula de Identidad</p>
                <p className="text-sm font-bold text-gray-700">{user.cedula}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Cargo</p>
                <p className="text-sm font-bold text-gray-700">{user.cargo}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Duración del Plan</p>
                <p className="text-sm font-bold text-blue-600">{plan.duracion_dias} días</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end border-l pl-6 border-gray-100 h-full justify-center">
            <div className="flex items-center space-x-2 mb-1">
               <span className={`h-3 w-3 rounded-full ${statusColors[status]}`}></span>
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                 {status === 'RED' ? 'Atrasado' : status === 'YELLOW' ? 'En Riesgo' : 'Al Día'}
               </span>
            </div>
            <p className="text-sm font-black text-gray-900">
              {remaining > 0 ? `${remaining} días restantes` : 'Plazo vencido'}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">F. Ingreso: {user.fecha_ingreso}</p>
          </div>
        </div>
      </div>

      {/* Instrucciones Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-800 px-6 py-2">
          <h2 className="text-white text-[10px] font-black uppercase tracking-widest">Instrucciones</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {displayedInstructions.map((instruction, i) => (
              <li key={i} className="flex items-start space-x-3 text-xs text-gray-600 leading-relaxed">
                <span className="flex-shrink-0 h-5 w-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">
                  {i + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Progreso General del Plan</h2>
          <span className="text-lg font-black text-blue-600">{progress.progreso_porcentaje}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${progress.progreso_porcentaje}%` }}
          ></div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit mx-auto sm:mx-0">
        <button 
          onClick={() => setActiveTab('CONOCIMIENTOS')}
          className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'CONOCIMIENTOS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Progreso del Plan
        </button>
        <button 
          onClick={() => setActiveTab('COMPETENCIAS')}
          className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'COMPETENCIAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Evaluación Competencias
        </button>
      </div>

      {activeTab === 'COMPETENCIAS' ? (
        /* Competencies Section */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Visual Reference House */}
          <CompetencyHouse cargo={user.cargo} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-indigo-900 px-6 py-2 flex justify-between items-center">
              <h2 className="text-white text-[10px] font-black uppercase tracking-widest">Resultados y Comentarios del Supervisor</h2>
              <span className="text-[10px] text-indigo-300 font-bold uppercase">Feedback Directo</span>
            </div>
            <div className="p-6">
              {progress.evaluaciones && progress.evaluaciones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {progress.evaluaciones.map((evalItem, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-gray-700 uppercase tracking-tight leading-tight flex-1 pr-2">
                          {evalItem.competencia}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0 ${
                          evalItem.resultado === 'LOGRADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {evalItem.resultado === 'LOGRADO' ? 'Logrado' : 'A Mejorar'}
                        </span>
                      </div>
                      {evalItem.feedback && (
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm italic text-[11px] text-gray-600 leading-relaxed">
                          <span className="text-blue-500 font-bold not-italic mr-1">"</span>
                          {evalItem.feedback}
                          <span className="text-blue-500 font-bold not-italic ml-1">"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 text-gray-400 mb-3">
                    <IconAlert />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Aún no tienes evaluaciones registradas por tu supervisor.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Modules Table-like structure */
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {plan.modulos.map((module) => (
            <div key={module.titulo} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button 
                onClick={() => toggleModule(module.titulo)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-gray-800">{module.titulo}</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-[10px] font-bold text-gray-600 rounded uppercase">
                    {module.tipo_modulo}
                  </span>
                </div>
                <div className={`${expandedModules[module.titulo] ? 'rotate-180' : ''} transition-transform`}>
                  <IconChevronDown />
                </div>
              </button>

              {expandedModules[module.titulo] && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b">
                        <th className="px-6 py-3">Estatus</th>
                        <th className="px-6 py-3">Procesos / Sistemas (PAP)</th>
                        <th className="px-6 py-3">Material PAP</th>
                        <th className="px-6 py-3">Academia / Video</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {module.tareas.map((task, idx) => {
                        const resource = resources.find(r => r.codigo === task.recurso_ref);
                        const isCompleted = progress.checks_completados.includes(task.recurso_ref);
                        
                        const isPAP = resource?.tipo === ResourceType.PAP;
                        const isAcademia = resource?.tipo === ResourceType.VIDEO || resource?.tipo === ResourceType.CURSO;
                        const isEncuesta = task.tipo_visual === ResourceType.ENCUESTA;

                        return (
                          <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => task.recurso_ref && onCheckTask(task.recurso_ref)}
                                className={`h-6 w-6 rounded border flex items-center justify-center transition-all ${
                                  isCompleted 
                                    ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                                    : 'bg-white border-gray-300 hover:border-blue-500'
                                } ${!task.recurso_ref ? 'opacity-30 cursor-not-allowed' : ''}`}
                              >
                                {isCompleted && <IconCheck />}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <h4 className={`text-sm font-semibold ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {task.descripcion}
                              </h4>
                              {task.recurso_ref && <p className="text-[10px] text-gray-400 font-mono">{task.recurso_ref}</p>}
                            </td>
                            <td className="px-6 py-4">
                              {(isPAP || (!isAcademia && resource?.url)) ? (
                                <button 
                                  onClick={() => window.open(resource?.url, '_blank')}
                                  className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <IconFile />
                                  <span className="text-xs font-bold uppercase underline">Ver Documento</span>
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 font-medium">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {(isAcademia || isEncuesta) ? (
                                <button 
                                  onClick={() => window.open(resource?.url, '_blank')}
                                  className="flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                                >
                                  {isEncuesta ? <IconLink /> : <IconPlay />}
                                  <span className="text-xs font-bold uppercase">{isEncuesta ? 'Encuesta' : 'Video Academia'}</span>
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 font-medium">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Survey Button */}
      <div className="pt-8 pb-4 flex justify-center">
        <button 
          onClick={() => window.open('https://farmatodoex.qualtrics.com/jfe/form/SV_3yHnURjAyvWxsj4?Q_CHL=qr', '_blank')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-200 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center space-x-3 group"
        >
          <span className="uppercase tracking-widest text-sm">Llenar Encuesta de Satisfacción</span>
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
            <IconLink />
          </div>
        </button>
      </div>
    </div>
  );
};

export default CollaboratorView;


import React, { useState } from 'react';
import { User, MasterPlan, UserProgress, ResourceType, Resource, Task } from '../types';
import { IconFile, IconPlay, IconLink, IconCheck, IconChevronDown, IconAlert, IconInfo } from './Icons';
import { calculateTrafficLight, getRemainingDays, determinePlanStatus, getCulminationDate } from '../utils/logic';
import CompetencyHouse from './CompetencyHouse';
import { PlanState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  user: User;
  plan: MasterPlan;
  progress: UserProgress;
  resources: Resource[];
  onCheckTask: (resourceId: string) => void;
}

const CollaboratorView: React.FC<Props> = ({ user, plan, progress, resources, onCheckTask }) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ 'Plan de Inducción': true });
  const [activeTab, setActiveTab] = useState<'CONOCIMIENTOS' | 'COMPETENCIAS'>('CONOCIMIENTOS');
  const [showProfile, setShowProfile] = useState(false);

  const { status: planStatus, isExpired, duration } = determinePlanStatus(user, progress, progress.estado_general === PlanState.FORMADO);
  const culminationDate = getCulminationDate(user.fecha_ingreso, duration);

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

  const getStatusBadge = (state: PlanState) => {
    switch (state) {
      case PlanState.EN_PROCESO:
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200">En Proceso</span>;
      case PlanState.PENDIENTE:
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-200">Pendiente</span>;
      case PlanState.FALTA_APROBACION:
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-200">Falta Aprobación</span>;
      case PlanState.FORMADO:
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">Formado</span>;
      default:
        return null;
    }
  };

  // Location logic
  const isOperaciones = user.unidad_negocio === 'Operaciones';
  const unidadTienda = isOperaciones ? user.tienda : user.area_especifica;
  const areaValue = isOperaciones ? user.area : null;
  const isOperacionesVal = user.unidad_negocio === 'Operaciones'; // Local duplicate check for clarity

  const [showInstructions, setShowInstructions] = useState(true);
  const [expandedInstructions, setExpandedInstructions] = useState<number | null>(0);

  const instructions = [
    {
      title: "Bienvenida al Plan de Entrenamiento",
      content: "El Plan de Entrenamiento tiene como objetivo garantizar el dominio de los procesos del cargo y facilitar tu adaptación a la cultura organizacional, para lograr un desempeño exitoso en tu rol. Durante este proceso contarás con el acompañamiento de tu supervisor inmediato, quien te apoyará en cada etapa del entrenamiento."
    },
    {
      title: "Cómo completar una tarea",
      content: "El supervisor asignará a la persona que te explicará, enseñará y demostrará cada tarea o proceso. Luego, tú como colaborador nuevo ingreso, deberás ejecutar lo aprendido.\n\nA medida que avances, ingresa a la lista de tareas en la pestaña Mi plan de entrenamiento y presiona el botón de check cuando domines la actividad descrita. Al marcarla como completada, el sistema guardará tu avance automáticamente. Puedes cambiar el estado de la tarea si necesitas corregirla.\n\nEs tu responsabilidad revisar el material de apoyo y realizar las formaciones de la Academia Farmatodo correspondientes a cada semana del entrenamiento."
    },
    {
      title: "Consulta tu progreso",
      content: "Podrás visualizar el progreso de tu Plan de Entrenamiento y las tareas completadas. Así como el estatus del mismo para ver hasta qué fecha tienes para culminarlo. Recuerda que eres responsable de tu desarrollo y seguimiento de los plazos establecidos."
    },
    {
      title: "Revisión del supervisor",
      content: "Al momento de que finalices el Plan de Entrenamiento el supervisor revisará que hayas completado las tareas correspondientes a tu cargo y validará que realmente las domines. Luego aprobará el plan de entrenamiento, para certificar su culminación y tu avance se registre como aprobado."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-0 space-y-8">
      {/* Top Section: Vital Info */}
      <div className="mb-8">
        <div className="mb-10">
          <h2 className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
            Tu Plan de Entrenamiento
          </h2>
          <div className="h-1.5 w-16 bg-blue-600 rounded-full shadow-sm shadow-blue-200"></div>
        </div>

        {/* Vital Info Display Area */}
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="group text-left"
            >
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase transition-colors group-hover:text-blue-700">
                {user.display_name}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                  {user.cargo}
                </p>
                <span className="text-blue-200">•</span>
                <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline cursor-pointer flex items-center group/btn">
                  {showProfile ? 'Ocultar detalles' : 'Ver más información'}
                  <div className={`ml-1 transition-all duration-300 ${showProfile ? 'rotate-180 text-blue-800 scale-110' : 'text-blue-400 group-hover/btn:text-blue-600'}`}>
                    <IconChevronDown />
                  </div>
                </span>
              </div>
            </button>
          </div>
          
          {/* Dashboard Summary - Always Visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">Duración</p>
                <p className="text-xs font-black text-blue-800 uppercase">{duration} Días</p>
             </div>

             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 opacity-70">Culminación</p>
                <p className="text-xs font-black text-red-600 uppercase">{culminationDate}</p>
             </div>

             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative group">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-70">Estatus Actual</p>
                  <div className="text-blue-300 hover:text-blue-600 transition-colors cursor-help">
                    <IconInfo />
                  </div>
                </div>
                {getStatusBadge(planStatus)}
                
                {/* Tooltip Estatus */}
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-900 text-white p-3 rounded-xl text-[9px] font-medium leading-tight shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="font-black mb-1 uppercase text-blue-400">Significado:</p>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="text-blue-400 font-bold">• En Proceso:</span> Aprendiendo.</li>
                    <li><span className="text-red-400 font-bold">• Pendiente:</span> Pendiente por terminar el entrenamiento.</li>
                    <li><span className="text-yellow-400 font-bold">• Falta Aprobación:</span> Revisión.</li>
                    <li><span className="text-green-400 font-bold">• Formado:</span> Completado.</li>
                  </ul>
                  <div className="absolute top-full left-4 border-8 border-transparent border-t-gray-900"></div>
                </div>
             </div>

             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative group">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-70">Plazo Actual</p>
                  <div className="text-blue-300 hover:text-blue-600 transition-colors cursor-help">
                    <IconInfo />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                   <span className={`h-2 w-2 rounded-full ${isExpired ? 'bg-red-500' : 'bg-green-500'}`}></span>
                   <p className={`text-xs font-black uppercase ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                     {isExpired ? 'VENCIDO' : 'VIGENTE'}
                   </p>
                </div>

                {/* Tooltip Plazo */}
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-900 text-white p-3 rounded-xl text-[9px] font-medium leading-tight shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="font-black mb-1 uppercase text-blue-400">Semáforo de Plazo:</p>
                  <ul className="space-y-1 text-gray-300">
                    <li><span className="text-green-400 font-bold">• VIGENTE:</span> Estás dentro del tiempo total de tu plan de formación.</li>
                    <li><span className="text-red-400 font-bold">• VENCIDO:</span> Has superado la fecha estimada de culminación.</li>
                  </ul>
                  <div className="absolute top-full left-4 border-8 border-transparent border-t-gray-900"></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Toggled Profile Detail - ONLY Org Info */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1.5">Cédula de Identidad</p>
                    <p className="text-sm font-bold text-gray-800">{user.numeroID}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1.5">Vicepresidencia</p>
                    <p className="text-sm font-bold text-gray-800">{user.unidad_negocio}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1.5">Unidad / Tienda</p>
                    <p className="text-sm font-bold text-gray-800">{unidadTienda}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1.5">Área Específica</p>
                    <p className="text-sm font-bold text-gray-800">{areaValue || 'Sede Especializada'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1.5">Correo Corporativo</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1.5">Fecha de Ingreso</p>
                    <p className="text-sm font-bold text-gray-800">{user.fecha_ingreso}</p>
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instrucciones Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full bg-gray-800 px-6 py-3 flex justify-between items-center hover:bg-gray-700 transition-colors"
        >
          <h2 className="text-white text-[10px] font-black uppercase tracking-widest flex items-center">
            <IconInfo />
            <span className="ml-2">Instrucciones</span>
          </h2>
          <div className={`transition-transform duration-300 ${showInstructions ? 'rotate-180 text-white' : 'text-white/40'}`}>
            <IconChevronDown />
          </div>
        </button>

        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 md:p-8 space-y-4">
                {instructions.map((item, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden transition-all">
                    <button 
                      onClick={() => setExpandedInstructions(expandedInstructions === idx ? null : idx)}
                      className={`w-full flex items-center p-5 text-left transition-colors ${expandedInstructions === idx ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs mr-4 transition-all ${expandedInstructions === idx ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-50 text-blue-600'}`}>
                        {idx + 1}
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tight flex-1 ${expandedInstructions === idx ? 'text-blue-900' : 'text-gray-700'}`}>
                        {item.title}
                      </span>
                      <div className={`transition-transform duration-300 ${expandedInstructions === idx ? 'rotate-180 text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        <IconChevronDown />
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedInstructions === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-white"
                        >
                          <div className="p-6 pt-0 ml-12">
                            <p className="text-[11px] text-gray-600 font-medium leading-relaxed whitespace-pre-line border-l-2 border-blue-100 pl-4">
                              {item.content}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar Container */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-sm font-black text-blue-950 uppercase tracking-widest mb-1">PROGRESO GENERAL DEL PLAN</h2>
          </div>
          <div className="text-right">
             <span className="text-4xl font-black text-blue-600 tracking-tighter">{progress.progreso_porcentaje}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 p-1 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress.progreso_porcentaje}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="bg-blue-600 h-full rounded-full shadow-lg shadow-blue-200 relative"
          >
             <div className="absolute top-0 right-0 h-full w-2 bg-white/20 rounded-full"></div>
          </motion.div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex bg-white p-1.5 rounded-[1.5rem] w-fit mx-auto sm:mx-0 shadow-lg border border-gray-100">
        <button 
          onClick={() => setActiveTab('CONOCIMIENTOS')}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === 'CONOCIMIENTOS' ? 'bg-blue-600 text-white shadow-xl translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Módulos del Plan
        </button>
        <button 
          onClick={() => setActiveTab('COMPETENCIAS')}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === 'COMPETENCIAS' ? 'bg-blue-600 text-white shadow-xl translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Mi Perfil de Competencias
        </button>
      </div>

      {activeTab === 'COMPETENCIAS' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CompetencyHouse cargo={user.cargo} />

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-blue-950 px-8 py-4 flex justify-between items-center">
              <h2 className="text-white text-[10px] font-black uppercase tracking-widest">Feedback del Supervisor</h2>
              <IconAlert />
            </div>
            <div className="p-8">
              {progress.evaluaciones && progress.evaluaciones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {progress.evaluaciones.map((evalItem, idx) => (
                    <div key={idx} className="p-6 rounded-3xl border border-gray-50 bg-gray-50/50 flex flex-col space-y-4 hover:bg-white hover:shadow-xl transition-all border hover:border-blue-100">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-tight leading-tight flex-1">
                          {evalItem.competencia}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0 border ${
                          evalItem.resultado === 'LOGRADO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {evalItem.resultado}
                        </span>
                      </div>
                      {evalItem.feedback && (
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic border-l-2 border-blue-200 pl-3">
                          "{evalItem.feedback}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-[1.5rem] bg-white text-gray-300 mb-4 shadow-sm">
                    <IconAlert />
                  </div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Sin evaluaciones registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {plan.modulos.map((module) => (
            <div key={module.titulo} className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden group">
              <button 
                onClick={() => toggleModule(module.titulo)}
                className="w-full flex items-center justify-between p-8 bg-white hover:bg-gray-50/50 transition-all"
              >
                <div className="flex items-center space-x-6">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-blue-950 uppercase tracking-tighter leading-tight">{module.titulo}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {module.tareas.filter(task => progress.checks_completados.includes(task.recurso_ref)).length}/{module.tareas.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300 ${expandedModules[module.titulo] ? 'rotate-180 bg-gray-100 text-blue-600 shadow-sm' : 'bg-gray-50/50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'}`}>
                  <IconChevronDown />
                </div>
              </button>

              <AnimatePresence>
                {expandedModules[module.titulo] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-x-auto border-t border-gray-50"
                  >
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-gray-50/50 text-[9px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                          <th className="px-8 py-4 w-20 text-center">Estado</th>
                          <th className="px-8 py-4">Procesos / Sistemas</th>
                          <th className="px-8 py-4 w-40">Material de apoyo</th>
                          <th className="px-8 py-4 w-40">Recurso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {module.tareas.map((task, idx) => {
                          const resource = resources.find(r => r.codigo === task.recurso_ref);
                          const isCompleted = progress.checks_completados.includes(task.recurso_ref);
                          const isPAP = resource?.tipo === ResourceType.PAP;
                          const isAcademia = resource?.tipo === ResourceType.VIDEO || resource?.tipo === ResourceType.CURSO;
                          const isEncuesta = task.tipo_visual === ResourceType.ENCUESTA || resource?.tipo === ResourceType.ENCUESTA;

                          return (
                            <tr key={idx} className={`hover:bg-blue-50/20 transition-all ${isCompleted ? 'bg-green-50/10' : ''}`}>
                              <td className="px-8 py-5">
                                <div className="flex justify-center">
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (task.recurso_ref) onCheckTask(task.recurso_ref);
                                    }}
                                    className={`h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                                      isCompleted 
                                        ? 'bg-green-500 border-green-500 text-white shadow-lg scale-110 animate-in zoom-in-75' 
                                        : 'bg-white border-gray-200 hover:border-blue-400 hover:scale-110 active:scale-95'
                                    } ${!task.recurso_ref ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    {isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><IconCheck /></motion.div>}
                                  </button>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="max-w-md">
                                  <h4 className={`text-sm font-black tracking-tight ${isCompleted ? 'text-gray-400 line-through italic' : 'text-blue-950'}`}>
                                    {task.descripcion}
                                  </h4>
                                  {task.recurso_ref && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{task.recurso_ref}</p>}
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                {(isPAP || (!isAcademia && resource?.url)) ? (
                                  <a 
                                    href={resource?.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-2 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl border border-blue-100 transition-all text-[10px] font-black uppercase"
                                  >
                                    <IconFile />
                                    <span>Ver Guía</span>
                                  </a>
                                ) : <span className="text-gray-200">—</span>}
                              </td>
                              <td className="px-8 py-5">
                                {(isAcademia || isEncuesta) ? (
                                  <a 
                                    href={resource?.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-2 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-xl border border-indigo-100 transition-all text-[10px] font-black uppercase shadow-sm"
                                  >
                                    {isEncuesta ? <IconLink /> : <IconPlay />}
                                    <span>{isEncuesta ? 'Encuesta' : 'Video Academia'}</span>
                                  </a>
                                ) : <span className="text-gray-200">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Survey Floating Action */}
      <div className="pt-12 pb-12 flex flex-col items-center">
        <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100 max-w-2xl w-full text-center">
          <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-2">¿Cómo ha sido tu experiencia?</h3>
          <p className="text-sm text-gray-500 font-medium mb-8">Tu feedback nos ayuda a mejorar el proceso de integración para toda la familia Farmatodo.</p>
          <button 
            onClick={() => window.open('https://farmatodoex.qualtrics.com/jfe/form/SV_3yHnURjAyvWxsj4?Q_CHL=qr', '_blank')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-10 rounded-[2rem] shadow-2xl shadow-blue-300 transition-all transform hover:-translate-y-2 flex items-center justify-center space-x-4 group"
          >
            <span className="uppercase tracking-widest text-sm">Iniciar Encuesta de Satisfacción</span>
            <div className="bg-white/20 p-1.5 rounded-xl group-hover:rotate-12 transition-transform">
              <IconLink />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorView;

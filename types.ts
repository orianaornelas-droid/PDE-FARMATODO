export enum UserRole {
  COLABORADOR = 'COLABORADOR',
  SUPERVISOR_TIENDA = 'SUPERVISOR_TIENDA',
  SUPERVISOR_OFICINA = 'SUPERVISOR_OFICINA',
  ADMIN = 'ADMIN'
}

export enum UserArea {
  OPERACIONES = 'Operaciones',
  OFICINA = 'Oficina'
}

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  display_name: string;
  numeroID: string;
  cargo: string;
  fecha_ingreso: string;
  email: string;
  pais: string;
  vicepresidencia: string;
  unidad_negocio: string;
  tienda: string;
  area_especifica: string;
  area: string;
  rol_sistema: UserRole;
  id_supervisor: string;
}

export enum ResourceType {
  PAP = 'PAP',
  VIDEO = 'VIDEO',
  CURSO = 'CURSO',
  ENCUESTA = 'ENCUESTA'
}

export interface Resource {
  codigo: string;
  nombre: string;
  tipo: ResourceType;
  url?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export enum ModuloType {
  ESTANDAR = 'ESTANDAR',
  PERSONALIZADO = 'PERSONALIZADO'
}

export interface ResourceReference {
  nombre: string;
  enlace: string;
}

export interface Task {
  id: string;
  descripcion: string;
  recurso_ref: string;
  recursos: ResourceReference[];
  obligatorio: boolean;
  tipo_visual?: ResourceType;
  pap?: string;
  curso?: string;
}

export interface Module {
  id: string;
  titulo: string;
  tipo_modulo: ModuloType;
  tareas: Task[];
}

export interface MasterPlan {
  id_plan: string;
  cargo_target: string;
  duracion_dias: number;
  modulos: Module[];
  pais?: string;
  vp?: string;
  unidad?: string;
}

export enum PlanState {
  EN_PROCESO = 'EN_PROCESO',
  PENDIENTE = 'PENDIENTE',
  FORMADO = 'FORMADO',
  FALTA_APROBACION = 'FALTA_APROBACION'
}

export interface Evaluation {
  competencia: string;
  resultado: 'LOGRADO' | 'A_MEJORAR';
  feedback: string;
}

export interface UserProgress {
  id_usuario: string;
  id_plan: string;
  fecha_inicio: string;
  estado_general: PlanState;
  progreso_porcentaje: number;
  checks_completados: string[];
  evaluaciones: Evaluation[];
  ultima_actividad: string;
}

export interface Instruccion {
  id?: string;
  titulo: string;
  contenido: string;
}

export interface Cargo {
  cargo: string;
  rol: string;
  pde_asignado: string;
  duracion_dias: number;
}

export interface Plan {
  id?: string;
  nombre_plan: string;
}

export interface Modulo {
  id?: string;
  nombre_modulo: string;
  plan_id: string;
  orden: number;
}

export interface Tarea {
  id?: string;
  nombre_tarea: string;
  modulo: string;
  pap: string;
  curso: string;
}

export interface Recurso {
  id?: string;
  nombre_recurso: string;
  tipo: string;
  enlace: string;
}

export enum TrafficLightStatus {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN'
}

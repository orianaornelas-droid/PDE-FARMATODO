import { TrafficLightStatus, UserProgress, MasterPlan, PlanState, User } from '../types';

export const determinePlanStatus = (
  user: User,
  progress: UserProgress,
  isApprovedBySupervisor: boolean = false,
  duracionDias: number = 30
): { status: PlanState; isExpired: boolean; duration: number } => {
  const duration = duracionDias;
  const startDate = new Date(user.fecha_ingreso);
  const now = new Date();
  const elapsedDays = Math.ceil(Math.abs(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = elapsedDays >= duration;
  const isCompleted = progress.progreso_porcentaje >= 100;

  let status = PlanState.EN_PROCESO;
  if (isCompleted) {
    status = isApprovedBySupervisor ? PlanState.FORMADO : PlanState.FALTA_APROBACION;
  } else {
    status = isExpired ? PlanState.PENDIENTE : PlanState.EN_PROCESO;
  }

  return { status, isExpired, duration };
};

export const getCulminationDate = (admissionDate: string, durationDays: number): string => {
  const date = new Date(admissionDate);
  date.setDate(date.getDate() + durationDays);
  return date.toISOString().split('T')[0];
};

export const getRemainingDays = (startDateStr: string, duration: number): number => {
  const start = new Date(startDateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + duration);
  const today = new Date();
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const calculateTrafficLight = (
  progress: UserProgress,
  plan: MasterPlan
): TrafficLightStatus => {
  const startDate = new Date(progress.fecha_inicio);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + plan.duracion_dias);
  const today = new Date();
  if (today > endDate && progress.progreso_porcentaje < 100) return TrafficLightStatus.RED;
  const lastActivity = new Date(progress.ultima_actividad);
  const diffDays = Math.ceil(Math.abs(today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 3) return TrafficLightStatus.YELLOW;
  return TrafficLightStatus.GREEN;
};

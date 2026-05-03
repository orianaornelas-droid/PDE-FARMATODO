
export interface Competency {
  name: string;
  level: number;
}

export interface CompetencyModel {
  impulsando: Competency[];
  generando: Competency[];
  alcanzando: Competency[];
  valores: string[];
}

export const COMPETENCY_MODELS: Record<string, CompetencyModel> = {
  'APV Senior': {
    impulsando: [
      { name: 'Orientación a Resultados Excelentes', level: 2 },
      { name: 'Orientación al Cliente', level: 2 }
    ],
    generando: [
      { name: 'Liderazgo', level: 1 },
      { name: 'Desarrollo de Otros', level: 2 },
      { name: 'Dirección de Otros', level: 1 }
    ],
    alcanzando: [
      { name: 'Seguimiento y Control', level: 2 },
      { name: 'Sentido de Urgencia', level: 2 },
      { name: 'Excelencia Operativa', level: 1 },
      { name: 'Preocupación por el orden y el detalle', level: 3 },
      { name: 'Madurez Emocional', level: 3 },
      { name: 'Energía', level: 4 }
    ],
    valores: ['Ética e Integridad', 'Trabajo en Equipo']
  },
  'APV Junior': {
    impulsando: [
      { name: 'Orientación a Resultados Excelentes', level: 1 },
      { name: 'Orientación al Cliente', level: 1 }
    ],
    generando: [
      { name: 'Desarrollo de Otros', level: 1 },
      { name: 'Dirección de Otros', level: 1 }
    ],
    alcanzando: [
      { name: 'Seguimiento y Control', level: 1 },
      { name: 'Sentido de Urgencia', level: 1 },
      { name: 'Excelencia Operativa', level: 1 },
      { name: 'Preocupación por el orden y el detalle', level: 2 },
      { name: 'Madurez Emocional', level: 2 },
      { name: 'Conciencia de Equipo', level: 3 },
      { name: 'Energía', level: 3 }
    ],
    valores: ['Ética e Integridad', 'Trabajo en Equipo']
  },
  'Operador Logístico': {
    impulsando: [
      { name: 'Orientación a Resultados Excelentes', level: 1 },
      { name: 'Orientación al Cliente', level: 1 }
    ],
    generando: [
      { name: 'Liderazgo', level: 1 },
      { name: 'Desarrollo de Otros', level: 1 }
    ],
    alcanzando: [
      { name: 'Capacidad de Integración', level: 1 },
      { name: 'Excelencia Operativa', level: 2 },
      { name: 'Sentido de Urgencia', level: 1 },
      { name: 'Seguimiento y Control', level: 1 },
      { name: 'Energía', level: 3 }
    ],
    valores: ['Ética e Integridad', 'Trabajo en Equipo']
  },
  'Agente de Servicio': {
    impulsando: [
      { name: 'Orientación a Resultados Excelentes', level: 1 },
      { name: 'Orientación al Cliente', level: 1 }
    ],
    generando: [
      { name: 'Desarrollo de Otros', level: 1 }
    ],
    alcanzando: [
      { name: 'Excelencia Operativa', level: 1 },
      { name: 'Sentido de Urgencia', level: 1 },
      { name: 'Capacidad de Integración', level: 1 },
      { name: 'Influencia y Negociación', level: 1 },
      { name: 'Madurez Emocional', level: 1 },
      { name: 'Energía', level: 3 }
    ],
    valores: ['Ética e Integridad', 'Trabajo en Equipo']
  },
  'Analista RRHH': {
    impulsando: [
      { name: 'Orientación a Resultados Excelentes', level: 2 },
      { name: 'Orientación al Cliente', level: 2 },
      { name: 'Vanguardia e Innovación', level: 1 },
      { name: 'Visión de Negocio', level: 1 }
    ],
    generando: [
      { name: 'Liderazgo', level: 1 },
      { name: 'Desarrollo de Otros', level: 1 }
    ],
    alcanzando: [
      { name: 'Capacidad de Integración', level: 1 },
      { name: 'Excelencia Operativa', level: 2 },
      { name: 'Sentido de Urgencia', level: 2 },
      { name: 'Influencia y Negociación', level: 1 },
      { name: 'Madurez Emocional', level: 2 },
      { name: 'Seguimiento y Control', level: 2 }
    ],
    valores: ['Ética e Integridad', 'Trabajo en Equipo']
  }
};

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserProgress, Cargo, Plan, Modulo, Tarea, Recurso, Instruccion, MasterPlan, ModuloType, PlanState, ResourceType } from '../types';

export const firebaseService = {

  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as User : null;
    } catch (error) { console.error('Error getUser:', error); return null; }
  },

  async saveUser(user: User): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (error) { console.error('Error saveUser:', error); }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
    } catch (error) { console.error('Error getAllUsers:', error); return []; }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) return { ...snap.docs[0].data(), id: snap.docs[0].id } as User;
      return null;
    } catch (error) { console.error('Error getUserByEmail:', error); return null; }
  },

  async getCargos(): Promise<Cargo[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'cargos'));
      return querySnapshot.docs.map(d => d.data() as Cargo);
    } catch (error) { console.error('Error getCargos:', error); return []; }
  },

  async getCargoByNombre(nombreCargo: string): Promise<Cargo | null> {
    try {
      const q = query(collection(db, 'cargos'), where('cargo', '==', nombreCargo));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].data() as Cargo;
      return null;
    } catch (error) { console.error('Error getCargoByNombre:', error); return null; }
  },

  async getPlanes(): Promise<Plan[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'planes'));
      return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Plan));
    } catch (error) { console.error('Error getPlanes:', error); return []; }
  },

  async getModulos(): Promise<Modulo[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'modulos'));
      return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Modulo));
    } catch (error) { console.error('Error getModulos:', error); return []; }
  },

  async getTareas(): Promise<Tarea[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'tareas'));
      return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Tarea));
    } catch (error) { console.error('Error getTareas:', error); return []; }
  },

  async getBibliotecaRecursos(): Promise<Recurso[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'biblioteca_recursos'));
      return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Recurso));
    } catch (error) { console.error('Error getBibliotecaRecursos:', error); return []; }
  },

  async getInstrucciones(): Promise<Instruccion[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'instrucciones'));
      return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Instruccion));
    } catch (error) { console.error('Error getInstrucciones:', error); return []; }
  },

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const q = query(collection(db, 'seguimiento_tareas'), where('id_usuario', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].data() as UserProgress;
      return null;
    } catch (error) { console.error('Error getUserProgress:', error); return null; }
  },

  async getAllProgress(): Promise<UserProgress[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'seguimiento_tareas'));
      return querySnapshot.docs.map(d => d.data() as UserProgress);
    } catch (error) { console.error('Error getAllProgress:', error); return []; }
  },

  async updateUserProgress(userId: string, progress: Partial<UserProgress>): Promise<void> {
    try {
      const q = query(collection(db, 'seguimiento_tareas'), where('id_usuario', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, 'seguimiento_tareas', snap.docs[0].id), {
          ...progress, ultima_actividad: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'seguimiento_tareas'), {
          id_usuario: userId,
          ...progress,
          ultima_actividad: new Date().toISOString(),
          estado_general: PlanState.EN_PROCESO
        });
      }
    } catch (error) { console.error('Error updateUserProgress:', error); }
  },

  async getFullPlans(): Promise<MasterPlan[]> {
    try {
      const [cargos, planes, modulos, tareas, biblioteca] = await Promise.all([
        this.getCargos(), this.getPlanes(), this.getModulos(),
        this.getTareas(), this.getBibliotecaRecursos()
      ]);

      return planes
        .filter(plan => plan.nombre_plan !== 'NO APLICA')
        .map(plan => {
          const planNombre = plan.nombre_plan;
          const planId = plan.id || planNombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const cargoConPlan = cargos.find(c => c.pde_asignado === planNombre);
          const duracion = cargoConPlan?.duracion_dias || 30;

          const planModulos = modulos
            .filter(m => m.plan_id === planId || m.plan_id === planNombre)
            .sort((a, b) => a.orden - b.orden);

          const modulosReconstruidos = planModulos.map(mod => {
            const modTareas = tareas.filter(t => t.modulo === mod.nombre_modulo);
            return {
              id: mod.id || mod.nombre_modulo,
              titulo: mod.nombre_modulo,
              tipo_modulo: ModuloType.ESTANDAR,
              tareas: modTareas.map(t => {
                const recursoLib = biblioteca.find(r => r.nombre_recurso === t.pap || r.nombre_recurso === t.curso);
                return {
                  id: t.id || t.nombre_tarea,
                  descripcion: t.nombre_tarea,
                  recurso_ref: t.id || t.nombre_tarea,
                  recursos: recursoLib ? [{ nombre: recursoLib.nombre_recurso, enlace: recursoLib.enlace || '' }] : [],
                  obligatorio: true,
                  pap: t.pap,
                  curso: t.curso,
                  tipo_visual: t.curso ? ResourceType.CURSO : t.pap ? ResourceType.PAP : undefined
                };
              })
            };
          });

          return {
            id_plan: planId,
            cargo_target: planNombre,
            duracion_dias: duracion,
            modulos: modulosReconstruidos
          };
        });
    } catch (error) { console.error('Error getFullPlans:', error); return []; }
  }
};

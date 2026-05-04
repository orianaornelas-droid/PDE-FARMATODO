import React, { useState, useEffect } from 'react';
import { User, UserRole, UserArea, UserProgress, MasterPlan, Resource, PlanState, Instruccion, ResourceType } from './types';
import CollaboratorView from './components/CollaboratorView';
import AdminView from './components/AdminView';
import SupervisorView from './components/SupervisorView';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { firebaseService } from './services/firebaseService';
import { determinePlanStatus } from './utils/logic';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<MasterPlan | null>(null);
  const [allUserProgress, setAllUserProgress] = useState<UserProgress[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allPlans, setAllPlans] = useState<MasterPlan[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [instrucciones, setInstrucciones] = useState<Instruccion[]>([]);
  const [cargoDuracion, setCargoDuracion] = useState<number>(30);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testCargo, setTestCargo] = useState('ASISTENTE DE PISO DE VENTA 5 Hs');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const allowed = email === 'orianavalentina05@gmail.com' || email.endsWith('@farmatodo.com');
        if (!allowed) {
          setLoginError('Acceso restringido. Usa tu correo corporativo @farmatodo.com');
          await signOut(auth);
          setLoading(false);
          return;
        }
        setAuthUser(firebaseUser);
        setLoginError(null);
        let profile = await firebaseService.getUser(firebaseUser.uid);
        if (!profile) {
          const isAdmin = email === 'orianavalentina05@gmail.com' || email === 'oriana.ornelas@farmatodo.com';
          profile = {
            id: firebaseUser.uid,
            nombre: firebaseUser.displayName?.split(' ')[0] || 'Usuario',
            apellido: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            display_name: firebaseUser.displayName || 'Usuario',
            numeroID: 'N/A',
            pais: 'VE',
            vicepresidencia: 'VP OPERACIONES',
            unidad_negocio: 'OPERACIONES',
            tienda: 'Por asignar',
            cargo: 'ASISTENTE DE PISO DE VENTA 5 Hs',
            area_especifica: 'OPERACIONES',
            area: 'ZONA01',
            rol_sistema: isAdmin ? UserRole.ADMIN : UserRole.COLABORADOR,
            email: email,
            fecha_ingreso: new Date().toISOString().split('T')[0],
            id_supervisor: ''
          };
          await firebaseService.saveUser(profile);
        }
        setCurrentUser(profile);
        await fetchData(profile);
      } else {
        setCurrentUser(null);
        setAuthUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (user: User) => {
    try {
      const [allP, allR, allProg, allU, allInst] = await Promise.all([
        firebaseService.getFullPlans(),
        firebaseService.getBibliotecaRecursos(),
        firebaseService.getAllProgress(),
        firebaseService.getAllUsers(),
        firebaseService.getInstrucciones()
      ]);

      const mappedResources: Resource[] = allR.map(r => ({
        codigo: r.id || r.nombre_recurso,
        nombre: r.nombre_recurso,
        tipo: (r.tipo as ResourceType) || ResourceType.PAP,
        url: r.enlace || undefined,
        estado: 'ACTIVO' as const
      }));

      setResources(mappedResources);
      setAllUserProgress(allProg);
      setAllUsers(allU);
      setAllPlans(allP);
      setInstrucciones(allInst);

      const cargoData = await firebaseService.getCargoByNombre(user.cargo);
      const planNombre = cargoData?.pde_asignado;
      const duracion = cargoData?.duracion_dias || 30;
      setCargoDuracion(duracion);

      let plan: MasterPlan | null = null;
      if (planNombre && planNombre !== 'NO APLICA') {
        plan = allP.find(p =>
          p.cargo_target === planNombre ||
          p.cargo_target.toLowerCase() === planNombre.toLowerCase()
        ) || null;
      }
      setCurrentPlan(plan);
    } catch (error) { console.error('Error fetchData:', error); }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoginError('Error al iniciar sesión. Intenta de nuevo.');
    }
  };

  const handleTestLogin = async () => {
    if (!testEmail) { setLoginError('Ingresa un email de prueba'); return; }
    const cargoData = await firebaseService.getCargoByNombre(testCargo);
    const duracion = cargoData?.duracion_dias || 30;
    setCargoDuracion(duracion);

    const mockUser: User = {
      id: `test_${testEmail.split('@')[0]}`,
      nombre: 'Usuario',
      apellido: 'Prueba',
      display_name: 'USUARIO PRUEBA',
      numeroID: 'V-00000000',
      pais: 'VE',
      vicepresidencia: 'VP OPERACIONES',
      unidad_negocio: 'OPERACIONES',
      tienda: 'FARMATODO LAS MERCEDES',
      cargo: testCargo,
      area_especifica: 'OPERACIONES',
      area: 'ZONA01',
      rol_sistema: testCargo.includes('GERENTE') ? UserRole.SUPERVISOR_TIENDA :
                   testEmail.includes('admin') ? UserRole.ADMIN : UserRole.COLABORADOR,
      email: testEmail,
      fecha_ingreso: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      id_supervisor: ''
    };
    setAuthUser({ email: testEmail, uid: mockUser.id, displayName: 'Usuario Prueba', photoURL: null });
    setCurrentUser(mockUser);
    await fetchData(mockUser);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthUser(null);
    setCurrentUser(null);
    setCurrentPlan(null);
    setAllUserProgress([]);
    setLoginError(null);
  };

  const handleCheckTask = async (taskId: string) => {
    if (!currentUser || !currentPlan) return;
    const progress = allUserProgress.find(p => p.id_usuario === currentUser.id) || {
      id_usuario: currentUser.id,
      id_plan: currentPlan.id_plan,
      fecha_inicio: currentUser.fecha_ingreso,
      estado_general: PlanState.EN_PROCESO,
      progreso_porcentaje: 0,
      checks_completados: [],
      evaluaciones: [],
      ultima_actividad: new Date().toISOString()
    };

    const isChecked = progress.checks_completados.includes(taskId);
    const newChecks = isChecked
      ? progress.checks_completados.filter(id => id !== taskId)
      : [...progress.checks_completados, taskId];

    const totalTasks = currentPlan.modulos.reduce((acc, m) => acc + m.tareas.length, 0);
    const newPct = totalTasks > 0 ? Math.round((newChecks.length / totalTasks) * 100) : 0;

    const { status } = determinePlanStatus(
      currentUser,
      { ...progress, checks_completados: newChecks, progreso_porcentaje: newPct },
      progress.estado_general === PlanState.FORMADO,
      cargoDuracion
    );

    const updated = { ...progress, checks_completados: newChecks, progreso_porcentaje: newPct, estado_general: status };
    setAllUserProgress(curr => {
      const exists = curr.find(p => p.id_usuario === currentUser.id);
      return exists ? curr.map(p => p.id_usuario === currentUser.id ? updated : p) : [...curr, updated];
    });
    await firebaseService.updateUserProgress(currentUser.id, updated);
  };

  const userProgress = allUserProgress.find(p => p.id_usuario === currentUser?.id) || {
    id_usuario: currentUser?.id || '',
    id_plan: currentPlan?.id_plan || '',
    fecha_inicio: currentUser?.fecha_ingreso || new Date().toISOString().split('T')[0],
    estado_general: PlanState.EN_PROCESO,
    progreso_porcentaje: 0,
    checks_completados: [],
    evaluaciones: [],
    ultima_actividad: new Date().toISOString()
  };

  const renderRoleSwitcher = () => (
    <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50 z-50 flex items-center space-x-2">
      {[
        { role: UserRole.COLABORADOR, label: 'Mi Plan' },
        { role: UserRole.SUPERVISOR_TIENDA, label: 'Gestión Equipo' },
        { role: UserRole.ADMIN, label: 'Administrar' }
      ].map(({ role, label }) => (
        <button
          key={role}
          onClick={() => setCurrentUser(prev => prev ? { ...prev, rol_sistema: role } : null)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
            currentUser?.rol_sistema === role
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
      >
        SALIR
      </button>
    </div>
  );

  const renderContent = () => {
    if (!currentUser) return null;
    switch (currentUser.rol_sistema) {
      case UserRole.ADMIN:
        return <AdminView allUsers={allUsers} allProgress={allUserProgress} allPlans={allPlans} />;
      case UserRole.SUPERVISOR_TIENDA:
      case UserRole.SUPERVISOR_OFICINA:
        return (
          <SupervisorView
            supervisor={currentUser}
            allUsers={allUsers}
            allProgress={allUserProgress}
            plan={currentPlan || allPlans[0]}
            resources={resources}
            onUpdateProgress={async (updated) => {
              setAllUserProgress(curr => curr.map(p => p.id_usuario === updated.id_usuario ? updated : p));
              await firebaseService.updateUserProgress(updated.id_usuario, updated);
            }}
          />
        );
      default:
        if (!currentPlan) return (
          <div className="text-center py-20">
            <div className="bg-blue-50 rounded-2xl p-10 max-w-md mx-auto">
              <p className="text-3xl mb-3">📋</p>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Sin plan asignado</h2>
              <p className="text-sm text-gray-500">
                Tu cargo <strong>{currentUser.cargo}</strong> no tiene un Plan de Entrenamiento asignado.
                Consulta con tu supervisor o RRHH.
              </p>
            </div>
          </div>
        );
        return (
          <CollaboratorView
            user={currentUser}
            plan={currentPlan}
            progress={userProgress}
            resources={resources}
            onCheckTask={handleCheckTask}
          />
        );
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#003B71]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  if (!authUser) return (
    <div className="min-h-screen bg-[#003B71] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="flex justify-center">
          <div className="bg-[#003B71] p-4 rounded-2xl">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#003B71"/>
              <text x="24" y="32" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">FT</text>
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-[#003B71]">Plan de Entrenamiento</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa con tu cuenta corporativa</p>
        </div>
        {loginError && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
            <p className="text-sm font-bold text-red-700 text-center">{loginError}</p>
          </div>
        )}
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-center space-x-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.49 12.275c0-.834-.067-1.638-.21-2.42H12v4.588h6.458c-.29 1.503-1.145 2.765-2.423 3.596v2.991h3.924c2.29-2.107 3.613-5.223 3.613-8.755z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.957-1.07 7.942-2.914l-3.924-2.992c-1.077.724-2.47 1.155-4.018 1.155-3.095 0-5.714-2.088-6.653-4.896H1.365v3.085C3.39 21.445 7.42 24 12 24z"/>
            <path fill="#FBBC05" d="M5.347 14.353c-.24-.724-.377-1.493-.377-2.353s.137-1.63.377-2.353V6.562H1.365C.493 8.196 0 10.04 0 12c0 1.96.493 3.804 1.365 5.438l3.982-3.085z"/>
            <path fill="#EA4335" d="M12 4.75c1.762 0 3.344.604 4.586 1.79l3.438-3.438C17.95 1.142 15.234 0 12 0 7.42 0 3.39 2.555 1.365 6.562l3.982 3.085c.939-2.808 3.558-4.897 6.653-4.897z"/>
          </svg>
          <span className="font-bold text-gray-700">Ingresar con Google</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center"><span className="px-3 bg-white text-[10px] font-bold text-gray-300 uppercase tracking-widest">Pruebas de desarrollo</span></div>
        </div>

        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl">
          <input type="email" placeholder="Email de prueba" value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="text" placeholder="Cargo exacto (ej: GERENTE DE TIENDA)" value={testCargo}
            onChange={(e) => setTestCargo(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <button onClick={handleTestLogin}
            className="w-full py-3 bg-[#003B71] text-white font-bold rounded-xl text-sm hover:bg-blue-900 transition-all">
            Simular Acceso
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#003B71] px-3 py-2 rounded-xl">
              <span className="text-white font-black text-sm">FT</span>
            </div>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div>
              <span className="font-black text-[#003B71] tracking-tighter text-base uppercase">Plan de Entrenamiento</span>
              <span className="ml-2 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Digital</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-gray-800">{currentUser?.display_name}</p>
              <p className="text-[10px] text-blue-500 font-bold">{currentUser?.cargo}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-xl overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-black text-sm">
              {authUser?.photoURL
                ? <img src={authUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                : currentUser?.display_name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </nav>
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {renderContent()}
        </div>
      </main>
      {renderRoleSwitcher()}
    </div>
  );
};

export default App;

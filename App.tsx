
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserArea, UserProgress, MasterPlan, Resource, PlanState, Instruccion } from './types';
import CollaboratorView from './components/CollaboratorView';
import AdminView from './components/AdminView';
import SupervisorView from './components/SupervisorView';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { firebaseService } from './services/firebaseService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<MasterPlan | null>(null);
  const [allUserProgress, setAllUserProgress] = useState<UserProgress[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allPlans, setAllPlans] = useState<MasterPlan[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [instrucciones, setInstrucciones] = useState<Instruccion[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testCargo, setTestCargo] = useState('APV Senior');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const isWhitelisted = email === 'orianavalentina05@gmail.com';
        const isFarmatodo = email.endsWith('@farmatodo.com') || email.endsWith('@farmado.com');

        if (!isWhitelisted && !isFarmatodo) {
          setLoginError('Acceso restringido. Por favor, ingresa con tu correo corporativo @farmatodo.com');
          await signOut(auth);
          setAuthState(null);
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        setAuthState(firebaseUser);
        setLoginError(null);
        
        // Try to fetch user profile from Firestore
        let profile = await firebaseService.getUser(firebaseUser.uid);
        
        // If no profile, create a default one (e.g. for new users)
        if (!profile) {
          profile = {
            id: firebaseUser.uid,
            nombre: firebaseUser.displayName?.split(' ')[0] || 'User',
            apellido: firebaseUser.displayName?.split(' ')[1] || '',
            cedula: 'N/A',
            pais: 'Venezuela',
            unidad_negocio: 'Operaciones',
            tienda: 'Oficina Central',
            cargo: 'APV Senior', // Default
            rol_sistema: firebaseUser.email === 'orianavalentina05@gmail.com' ? UserRole.ADMIN : UserRole.COLABORADOR,
            area: UserArea.OPERACIONES,
            fecha_ingreso: new Date().toISOString(),
            id_supervisor: 'user_admin'
          };
        }
        
        setCurrentUser(profile);
        await fetchData(profile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (user: User) => {
    const [allP, allR, allProg, allU, allInst] = await Promise.all([
      firebaseService.getFullPlans(),
      firebaseService.getBibliotecaRecursos(),
      firebaseService.getAllProgress(),
      firebaseService.getAllUsers(),
      firebaseService.getInstrucciones()
    ]);

    // Map Recurso to Resource for compatibility
    const mappedResources: Resource[] = allR.map(r => ({
      codigo: r.id || r.nombre_recurso,
      nombre: r.nombre_recurso,
      tipo: r.tipo as any,
      url: r.enlace,
      estado: 'ACTIVO'
    }));

    setResources(mappedResources);
    setAllUserProgress(allProg);
    setAllUsers(allU);
    setAllPlans(allP);
    setInstrucciones(allInst);
    
    const plan = allP.find(p => p.cargo_target === user.cargo) || allP[0];
    setCurrentPlan(plan);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleTestLogin = async () => {
    if (!testEmail) {
      setLoginError('Ingresa un email de prueba');
      return;
    }
    
    // Simulate a successful login with a mock firestore user
    const mockUid = `test_${testEmail.split('@')[0]}`;
    const mockUser: User = {
      id: mockUid,
      nombre: 'Test',
      apellido: 'User',
      cedula: 'TEST-123',
      pais: 'Venezuela',
      unidad_negocio: 'Operaciones',
      tienda: 'Tienda de Prueba',
      cargo: testCargo || 'APV Senior',
      rol_sistema: testEmail === 'admin@test.com' ? UserRole.ADMIN : UserRole.COLABORADOR,
      area: UserArea.OPERACIONES,
      fecha_ingreso: new Date().toISOString(),
      id_supervisor: 'test_supervisor'
    };

    setAuthState({ email: testEmail, uid: mockUid, displayName: 'Test User' });
    setCurrentUser(mockUser);
    await fetchData(mockUser);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthState(null);
    setCurrentUser(null);
  };

  // Get current user progress
  const defaultProgress: UserProgress = {
    id_usuario: currentUser?.id || '',
    id_plan: currentPlan?.id_plan || '',
    fecha_inicio: new Date().toISOString(),
    estado_general: PlanState.EN_PROCESO,
    progreso_porcentaje: 0,
    checks_completados: [],
    evaluaciones: [],
    ultima_actividad: new Date().toISOString()
  };
  const userProgress = allUserProgress.find(p => p.id_usuario === currentUser?.id) || defaultProgress;

  // Handle task completion
  const handleCheckTask = async (resourceId: string) => {
    if (!currentUser || !currentPlan) return;

    const prev = userProgress;
    const isAlreadyChecked = prev.checks_completados.includes(resourceId);
    const newChecks = isAlreadyChecked 
      ? prev.checks_completados.filter(id => id !== resourceId)
      : [...prev.checks_completados, resourceId];
    
    const totalTasks = currentPlan.modulos.reduce((acc, m) => acc + m.tareas.length, 0);
    const newProgress = Math.round((newChecks.length / totalTasks) * 100);

    const updatedProgress: Partial<UserProgress> = {
      checks_completados: newChecks,
      progreso_porcentaje: newProgress,
      ultima_actividad: new Date().toISOString()
    };

    // Update locally
    setAllUserProgress(currentAll => currentAll.map(p => 
      p.id_usuario === currentUser.id ? { ...p, ...updatedProgress } : p
    ));

    // Update in Firestore
    await firebaseService.updateUserProgress(currentUser.id, updatedProgress);
  };

  // Sidebar Role Switcher for demonstration
  const renderRoleSwitcher = () => (
    <div className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50 z-50 flex items-center space-x-2">
      {[UserRole.COLABORADOR, UserRole.SUPERVISOR_TIENDA, UserRole.ADMIN].map(role => (
        <button
          key={role}
          onClick={() => {
            setCurrentUser(prev => prev ? { ...prev, rol_sistema: role } : null);
          }}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
            currentUser?.rol_sistema === role 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {role === UserRole.COLABORADOR ? 'Mi Plan' : role === UserRole.SUPERVISOR_TIENDA ? 'Gestión de Equipo' : 'Administrar'}
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
    if (!currentUser || !currentPlan) return null;

    switch (currentUser.rol_sistema) {
      case UserRole.ADMIN:
        return (
          <AdminView 
            allUsers={allUsers}
            allProgress={allUserProgress}
            allPlans={allPlans}
          />
        );
      case UserRole.SUPERVISOR_TIENDA:
      case UserRole.SUPERVISOR_OFICINA:
        return (
          <SupervisorView 
            supervisor={currentUser}
            allUsers={allUsers}
            allProgress={allUserProgress} 
            plan={currentPlan}
            resources={resources}
            onUpdateProgress={async (updated) => {
              setAllUserProgress(currentAll => currentAll.map(p => p.id_usuario === updated.id_usuario ? updated : p));
              await firebaseService.updateUserProgress(updated.id_usuario, updated);
            }}
          />
        );
      default:
        return (
          <CollaboratorView 
            user={currentUser} 
            plan={currentPlan} 
            progress={userProgress} 
            resources={resources}
            instrucciones={instrucciones}
            onCheckTask={handleCheckTask}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authState) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm text-center space-y-10">
          {/* Logo Real con fallback */}
          <div className="flex justify-center mb-4">
            <img 
              src="https://raw.githubusercontent.com/orianavalentina/assets/main/farmatodo_vertical.png" 
              alt="Farmatodo Logo" 
              className="h-40 w-auto object-contain rounded-3xl"
              onError={(e) => {
                // Fallback to official Square Profile from Twitter/X CDN if the above fails
                (e.target as HTMLImageElement).src = "https://pbs.twimg.com/profile_images/1420760461623103491/2Gz_dI-j_400x400.png";
              }}
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-[#003B71] tracking-tight leading-tight">
              Plan de Entrenamiento
            </h1>
            <p className="text-gray-600 font-medium text-base leading-relaxed px-4">
              Aprende los procesos clave y vive nuestra cultura desde el primer día.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center space-x-3 animate-pulse">
              <div className="bg-red-500 text-white rounded-full p-1 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <p className="text-sm font-bold text-red-700 text-left leading-tight">{loginError}</p>
            </div>
          )}

          <div className="space-y-6 pt-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Para continuar, por favor identifica tu cuenta de colaborador Farmatodo.
            </p>
            
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex items-center justify-center space-x-3 group active:scale-[0.98]"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.49 12.275c0-.834-.067-1.638-.21-2.42H12v4.588h6.458c-.29 1.503-1.145 2.765-2.423 3.596v2.991h3.924c2.29-2.107 3.613-5.223 3.613-8.755z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.957-1.07 7.942-2.914l-3.924-2.992c-1.077.724-2.47 1.155-4.018 1.155-3.095 0-5.714-2.088-6.653-4.896H1.365v3.085C3.39 21.445 7.42 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.347 14.353c-.24-.724-.377-1.493-.377-2.353s.137-1.63.377-2.353V6.562H1.365C.493 8.196 0 10.04 0 12c0 1.96.493 3.804 1.365 5.438l3.982-3.085z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.762 0 3.344.604 4.586 1.79l3.438-3.438C17.95 1.142 15.234 0 12 0 7.42 0 3.39 2.555 1.365 6.562l3.982 3.085c.939-2.808 3.558-4.897 6.653-4.897z"
                />
              </svg>
              <span className="font-bold text-gray-700 group-hover:text-[#003B71]">Ingresar con Google</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center"><span className="px-3 bg-white text-[10px] font-bold text-gray-300 uppercase tracking-widest">O pruebas de desarrollo</span></div>
            </div>

            <div className="space-y-3 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
              <input 
                type="email" 
                placeholder="Email de prueba" 
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="Cargo (ej: APV Senior)" 
                value={testCargo}
                onChange={(e) => setTestCargo(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <button 
                onClick={handleTestLogin}
                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 transition-all active:scale-[0.98]"
              >
                Simular Acceso
              </button>
            </div>
          </div>
          
          <div className="pt-12">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
              Orgullosamente Farmatodo
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-24">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="https://pbs.twimg.com/profile_images/1420760461623103491/2Gz_dI-j_400x400.png" 
              alt="Farmatodo" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/e/e0/Farmatodo_logo.svg";
              }}
            />
            <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
            <div>
              <span className="font-black text-[#003B71] tracking-tighter text-lg uppercase">Plan de Entrenamiento</span>
              <span className="ml-2 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Carpeta Azul</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-800">{currentUser?.nombre} {currentUser?.apellido}</p>
                <p className="text-[10px] text-blue-500 font-bold tracking-tight">{currentUser?.rol_sistema}</p>
             </div>
             <div className="h-10 w-10 bg-gray-100 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                <img src={authState.photoURL || `https://picsum.photos/seed/${currentUser?.id}/100/100`} alt="Avatar" />
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-blue-950 tracking-tight">
              {currentUser?.rol_sistema === UserRole.ADMIN ? 'Gestión de Capacitación' : 
               currentUser?.rol_sistema?.startsWith('SUPERVISOR') ? 'Panel del Supervisor' : 
               'Mi Plan de Entrenamiento'}
            </h1>
            <p className="text-gray-500 font-medium">
               {currentUser?.rol_sistema === UserRole.ADMIN ? 'Control maestro de planes y recursos regionales.' : 
               currentUser?.rol_sistema?.startsWith('SUPERVISOR') ? `Gestión de equipo en ${currentUser.tienda}.` : 
               'Completa tus tareas para certificarte como APV Farmatodo.'}
            </p>
          </div>
          
          {renderContent()}
        </div>
      </main>

      {renderRoleSwitcher()}
    </div>
  );
};

export default App;

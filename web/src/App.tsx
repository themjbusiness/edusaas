import { createContext, useCallback, useContext, useEffect, useState, type ComponentType } from 'react';
import { get, getToken, post, setToken, setUnauthorizedHandler, type Me, type Role } from './lib/api';
import { useI18n } from './lib/i18n';
import { disablePush, pushSupport } from './lib/push';
import { go, useRoute } from './lib/router';
import { ErrorCard, Skeleton } from './ui';
import { HomePage } from './screens/HomePage';
import { SignIn as Login } from './screens/stitch/SignIn';
import Gallery from './screens/Gallery';
import { StudentHomeAliRaza as StudentHome } from './screens/stitch/StudentHomeAliRaza';
import { CourseLibraryEdusaas as Library } from './screens/stitch/CourseLibraryEdusaas';
const Subject = Library;
import { LessonPlayerPhysics12 as Lesson } from './screens/stitch/LessonPlayerPhysics12';
import Quiz from './screens/student/Quiz';
import { ParentHomeMrsFatimaRaza as ParentHome } from './screens/stitch/ParentHomeMrsFatimaRaza';
import { ParentPhysicsViewAliRaza as Child } from './screens/stitch/ParentPhysicsViewAliRaza';
import Messages from './screens/Messages';
import { TeacherMyClasses as TeacherHome } from './screens/stitch/TeacherMyClasses';
import { TeacherClassAttendanceClearance as ClassPage } from './screens/stitch/TeacherClassAttendanceClearance';
import { AdminHome } from './screens/stitch/AdminHome';
import { CollegeAdminActivityLog as Activity } from './screens/stitch/CollegeAdminActivityLog';
import { CollegeAdminPeopleDirectorySheets as People } from './screens/stitch/CollegeAdminPeopleDirectorySheets';
import { CollegeAdminClasses as Classes } from './screens/stitch/CollegeAdminClasses';
import { CollegeAdminCsvImport as Import } from './screens/stitch/CollegeAdminCsvImport';
import { ReviewList } from './screens/teacher/ReviewList';
import { ReviewLesson } from './screens/teacher/ReviewLesson';
import TeacherAtRisk from './screens/teacher/TeacherAtRisk';
import { PrincipalAnalytics } from './screens/admin/PrincipalAnalytics';
import { Layout } from './shell/Layout';

// ---------- session ----------
interface Session { me: Me; setMe: (m: Me) => void; signOut: () => void }
export const SessionCtx = createContext<Session | null>(null);
export function useSession(): Session {
  const s = useContext(SessionCtx);
  if (!s) throw new Error('useSession outside a signed-in screen');
  return s;
}

// ---------- routes ----------
type Screen = ComponentType<{ args: string[] }>;
const ROUTES: Record<string, { roles: Role[]; screen: Screen; nav?: string; player?: boolean }> = {
  home: { roles: ['student'], screen: StudentHome },
  subject: { roles: ['student'], screen: Subject, nav: 'home' },
  library: { roles: ['student'], screen: Library },
  lesson: { roles: ['student'], screen: Lesson, nav: 'home', player: true },
  quiz: { roles: ['student'], screen: Quiz, nav: 'home' },
  parent: { roles: ['parent'], screen: ParentHome },
  child: { roles: ['parent'], screen: Child, nav: 'parent' },
  msgs: { roles: ['teacher', 'parent'], screen: Messages },
  teacher: { roles: ['teacher'], screen: TeacherHome },
  atRisk: { roles: ['teacher'], screen: TeacherAtRisk, nav: 'atRisk' },
  class: { roles: ['teacher'], screen: ClassPage, nav: 'teacher' },
  review: { roles: ['teacher'], screen: ReviewList },
  reviewLesson: { roles: ['teacher'], screen: ReviewLesson, nav: 'review' },
  admin: { roles: ['college_admin'], screen: AdminHome },
  analytics: { roles: ['college_admin'], screen: PrincipalAnalytics, nav: 'admin' },
  activity: { roles: ['college_admin'], screen: Activity, nav: 'admin' },
  people: { roles: ['college_admin'], screen: People },
  classes: { roles: ['college_admin'], screen: Classes },
  import: { roles: ['college_admin'], screen: Import },
  landing: { roles: ['student', 'teacher', 'parent', 'college_admin'], screen: HomePage },
};
const HOME: Record<Role, string> = { student: '#/home', teacher: '#/teacher', parent: '#/parent', college_admin: '#/admin' };



export default function App() {
  const route = useRoute();
  const { lang, setLang } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState<{ message: string } | null>(null);
  const [hasToken, setHasToken] = useState(!!getToken());

  const signOut = useCallback(() => {
    const done = () => { setToken(null); setMe(null); setHasToken(false); go('#/login'); };
    // This phone should stop getting the previous person's alerts.
    if (getToken() && pushSupport() === 'ok') {
      let finished = false;
      const once = () => { if (!finished) { finished = true; done(); } };
      disablePush().then(once, once); setTimeout(once, 2000);
    } else done();
  }, []);

  useEffect(() => { setUnauthorizedHandler(() => { setMe(null); setHasToken(false); go('#/login'); }); }, []);
  useEffect(() => {
    try { const th = localStorage.getItem('edusaas_theme'); if (th) document.documentElement.setAttribute('data-theme', th); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!hasToken || me) return;
    get<Me>('me').then((m) => { setMe(m); if (m.language && m.language !== lang) setLang(m.language); },
      (e) => { if (e.status !== 401) setLoadError(e); });
  }, [hasToken, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSignedIn = useCallback((m: Me) => {
    setHasToken(true); setMe(m);
    if (m.language !== lang) post('me/language', { language: lang }).catch(() => {});
    go(HOME[m.role]);
  }, [lang]);

  // Routing decisions
  if (route.name === 'gallery') return <Layout><Gallery /></Layout>;
  if (route.name === 'logout') { if (hasToken || me) signOut(); else go('#/'); return null; }
  if (!hasToken) {
    if (route.name === 'login') {
      return <Layout route={route}><Login onSignedIn={onSignedIn} /></Layout>;
    }
    return <Layout route={{ name: 'home', args: [] }}><HomePage onSignedIn={onSignedIn} /></Layout>;
  }
  if (!me) return <Layout>{loadError ? <ErrorCard error={loadError} onRetry={() => { setToken(null); setHasToken(false); go('#/login'); }} /> : <Skeleton rows={2} />}</Layout>;
  const def = ROUTES[route.name];
  if (!def || !def.roles.includes(me.role)) {
    const homeRoute = HOME[me.role];
    go(homeRoute);
    const homeName = homeRoute.replace(/^#\/?/, '');
    const HomeScreen = ROUTES[homeName]?.screen || Login;
    return (
      <SessionCtx.Provider value={{ me, setMe, signOut }}>
        <Layout route={{ name: homeName, args: [] }}>
          <HomeScreen key={homeName} args={[]} />
        </Layout>
      </SessionCtx.Provider>
    );
  }
  const Screen = def.screen;
  return (
    <SessionCtx.Provider value={{ me, setMe, signOut }}>
      <Layout route={route}>
        <Screen key={route.name + '/' + route.args.join('/')} args={route.args} />
      </Layout>
    </SessionCtx.Provider>
  );
}

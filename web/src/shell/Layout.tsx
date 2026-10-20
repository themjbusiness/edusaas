import React, { useState, useContext } from 'react';
import { SessionCtx } from '../App';
import type { Role } from '../lib/api';

const NAV: Record<Role, [string, string, string][]> = {
  student: [['home', 'home', 'Home'], ['library', 'menu_book', 'Library']],
  teacher: [['teacher', 'group', 'My classes'], ['atRisk', 'warning', 'At-Risk'], ['review', 'rate_review', 'Review'], ['msgs', 'chat', 'Alerts log']],
  parent: [['parent', 'home', 'My child'], ['msgs', 'chat', 'Messages']],
  college_admin: [['admin', 'home', 'Home'], ['analytics', 'monitoring', 'Analytics'], ['people', 'group', 'People'], ['classes', 'class', 'Classes'], ['import', 'post_add', 'Import']],
};

import type { Route } from '../lib/router';
import { useI18n } from '../lib/i18n';

export function Layout({ children, route }: { children: React.ReactNode; route?: Route }) {
  const session = useContext(SessionCtx);
  const me = session?.me;
  const { subj } = useI18n();
  const [, force] = useState(0);

  function theme() {
    const r = document.documentElement, cur = r.getAttribute('data-theme');
    const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.setAttribute('data-theme', dark ? 'light' : 'dark');
    try { localStorage.setItem('edusaas_theme', dark ? 'light' : 'dark'); } catch { /* ignore */ }
    force((n) => n + 1);
  }

  const activeRoute = route?.name;

  function renderBreadcrumbs() {
    if (!route || !me) return null;
    
    const crumbs = [];
    if (me?.role === 'student' && ['subject', 'lesson', 'quiz'].includes(route.name)) {
      crumbs.push({ label: 'Library', href: '#/library' });
      const subjectId = route.args[0]?.split('_')[0];
      if (subjectId && (route.name === 'lesson' || route.name === 'quiz')) {
        crumbs.push({ label: subj(subjectId) || subjectId.toUpperCase(), href: `#/subject/${subjectId}` });
      }
    }
    if (me?.role === 'parent' && route.name === 'child') {
      crumbs.push({ label: 'My child', href: '#/parent' });
    }
    if (me?.role === 'teacher' && route.name === 'class') {
      crumbs.push({ label: 'My classes', href: '#/teacher' });
    }
    if (me?.role === 'teacher' && route.name === 'reviewLesson') {
      crumbs.push({ label: 'Review Content', href: '#/review' });
    }
    if (me?.role === 'college_admin' && route.name === 'activity') {
      crumbs.push({ label: 'Home', href: '#/admin' });
    }
    
    const currentLabels: Record<string, string> = {
      home: 'Home', library: 'Library', subject: 'Subject', lesson: 'Lesson', quiz: 'Quiz',
      parent: 'My child', child: 'Child Details', msgs: 'Messages', teacher: 'My classes',
      atRisk: 'At-Risk Catch-Up', class: 'Class Details', review: 'Review Content', reviewLesson: 'Curate Lesson',
      admin: 'Home', activity: 'Activity Log', people: 'People',
      classes: 'Classes', import: 'Import Data', gallery: 'Gallery'
    };
    
    let currentLabel = currentLabels[route.name] || (route.name.charAt(0).toUpperCase() + route.name.slice(1));
    if (route.name === 'subject' && route.args[0]) {
      currentLabel = subj(route.args[0]) || currentLabel;
    }
    
    return (
      <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-4 sm:px-6 md:px-8 py-2.5 overflow-x-auto hide-scrollbar">
        <nav aria-label="Breadcrumb" className="flex items-center w-full">
          <ol className="flex items-center gap-2 m-0 p-0 list-none whitespace-nowrap">
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <li>
                  <a href={crumb.href} className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors no-underline">
                    {crumb.label}
                  </a>
                </li>
                <li>
                  <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_right</span>
                </li>
              </React.Fragment>
            ))}
            <li>
              <span className="font-label-md text-label-md text-on-surface truncate block" aria-current="page">
                {currentLabel}
              </span>
            </li>
          </ol>
        </nav>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-margin-mobile flex items-center justify-between gap-space-sm">
          <a href="#/" className="flex items-center gap-space-sm min-w-0 no-underline cursor-pointer">
            <span className="inline-grid place-items-center w-8 h-8 rounded-lg bg-primary text-on-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">book</span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight truncate leading-tight">EduSaas</span>
              {me?.college && (
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium truncate max-w-[170px] sm:max-w-xs md:max-w-md leading-none">
                  {me.college}
                </span>
              )}
            </div>
          </a>
          <div className="flex items-center gap-space-xs">
            <button aria-label="Toggle Theme" onClick={theme} className="w-11 h-11 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer" type="button">
              <span className="material-symbols-outlined text-[20px]">dark_mode</span>
            </button>
            {!me ? (
              <a href="#/login" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-[13px] font-semibold shadow-xs hover:bg-primary-container transition-all no-underline">
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            ) : (
              <a href="#/" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </a>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-16 pb-[80px] flex flex-col">
        {route && renderBreadcrumbs()}
        <div className="flex-1">
          {children}
        </div>
      </main>
      
      {me && (
        <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex justify-around items-stretch h-16 max-w-[680px] mx-auto">
            {NAV[me.role].map(([name, icon, label]) => (
              <a key={name} className={`flex flex-col items-center justify-center gap-space-xs flex-1 min-h-[44px] transition-all no-underline ${activeRoute === name ? 'text-primary relative after:content-[\'\'] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[3px] after:bg-primary-container after:rounded-full' : 'text-on-surface-variant hover:text-on-surface'}`} href={`#/${name}`}>
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
                <span className="font-label-sm text-[11px] font-medium">{label}</span>
              </a>
            ))}
            <a className="flex flex-col items-center justify-center gap-space-xs flex-1 min-h-[44px] text-on-surface-variant hover:text-error transition-all no-underline" href="#/logout">
              <span className="material-symbols-outlined text-[24px]">logout</span>
              <span className="font-label-sm text-[11px] font-medium">Log out</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  );
}

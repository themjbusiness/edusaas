import { useState } from 'react';
import { post } from '../../lib/api';
import { prettyPhone } from '../../lib/format';
import { Tabs, useToast } from '../../ui';

const TEMPLATES = {
  students: 'class_grade,class_stream,class_section,roll_number,student_name,student_gender,student_phone,parent_name,parent_phone\n' +
    '11th,Pre-Medical,A,11A-21,Imran Ali,male,03001234567,Mr. Ali Khan,03007654321\n',
  teachers: 'teacher_name,teacher_phone,teacher_gender,subject,class_grade,class_stream,class_section\n' +
    'Ms. Hira Saleem,03001112233,female,English,11th,Pre-Medical,A\n',
};

interface Report {
  id: number; kind: string; counts: { rows: number; ok: number; errors: number };
  errors: { row: number; message: string }[];
  preview: { row: number; name: string; phone: string; class: string; roll?: string; parentName?: string; parentExists?: boolean; subject?: string }[];
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word.replace(/s$/, '') : word}`;

export default function Import({ args }: { args: string[] }) {
  const kind = args[0] === 'teachers' ? 'teachers' : 'students';
  const toast = useToast();
  const [csv, setCsv] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [done, setDone] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true); setError(''); setDone(null);
    try { setReport(await post<Report>('admin/imports', { kind, csv })); } catch (e) { setError((e as Error).message); setReport(null); }
    setBusy(false);
  }

  async function commit() {
    if (!report) return;
    setBusy(true);
    try { const r = await post<{ created: Record<string, number> }>(`admin/imports/${report.id}/commit`); setDone(r.created); setReport(null); setCsv(''); }
    catch (e) { toast((e as Error).message); }
    setBusy(false);
  }

  const ok = report && !report.errors.length;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-space-md py-space-sm animate-fade-in pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="font-headline-md text-[28px] font-bold text-primary">Bulk Import</h1>
        <p className="text-on-surface-variant font-body-md">Add a whole class, or all your teachers, from a spreadsheet saved as CSV.</p>
      </div>

      <Tabs label="Import" current={kind} items={[
        { key: 'students', href: '#/import/students', label: 'Students and parents' }, 
        { key: 'teachers', href: '#/import/teachers', label: 'Teachers' }
      ]} />

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">1</div>
            <p className="text-on-surface font-body-md mt-0.5">
              <a className="text-primary font-bold hover:underline cursor-pointer" href={'data:text/csv;charset=utf-8,' + encodeURIComponent(TEMPLATES[kind])} download={`edusaas-${kind}-template.csv`}>
                Download the template
              </a> and fill it in (Excel: File → Save as → CSV).
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">2</div>
            <p className="text-on-surface font-body-md mt-0.5">Choose the CSV file, or paste its contents below.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">3</div>
            <p className="text-on-surface font-body-md mt-0.5"><b>Check file</b>. Nothing is saved until you press <b>Import</b>.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <input type="file" accept=".csv,text/csv" className="w-full p-2 border border-outline-variant rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary/20 cursor-pointer" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const rd = new FileReader(); rd.onload = () => setCsv(String(rd.result)); rd.readAsText(f);
          }} />
          
          <textarea rows={6} className="w-full p-4 border border-outline-variant rounded-xl font-mono text-[13px] bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y" placeholder={TEMPLATES[kind].split('\n')[0]} value={csv} onChange={(e) => setCsv(e.target.value)} />
          
          <button className="flex items-center justify-center gap-2 h-12 px-6 mt-2 rounded-xl bg-primary text-on-primary font-label-lg font-bold hover:bg-primary/90 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none" disabled={busy || !csv.trim()} onClick={check}>
            {busy && !report ? 'Checking...' : 'Check File'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container border border-error/20 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-fade-in">
          <span className="material-symbols-outlined text-[24px]">error</span>
          <span className="font-body-md font-bold">{error}</span>
        </div>
      )}

      {done && (
        <div className="bg-[#e3f4f2] text-[#0b6f66] border border-[#0b6f66]/20 rounded-xl p-4 flex flex-col gap-1 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-bold font-title-md">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
            Import Complete
          </div>
          <p className="font-body-md ml-8">
            {Object.entries(done).map(([k, v]) => plural(v, k)).join(', ')} created successfully. They can sign in with their phone numbers now.
          </p>
        </div>
      )}

      {report && (
        <div className="flex flex-col gap-space-md animate-fade-in mt-4">
          <div className={`rounded-xl p-4 flex flex-col gap-1 shadow-sm border ${ok ? 'bg-[#e3f4f2] text-[#0b6f66] border-[#0b6f66]/20' : 'bg-error-container text-on-error-container border-error/20'}`}>
            <div className="flex items-center gap-2 font-bold font-title-md">
              <span className="material-symbols-outlined text-[24px]">{ok ? 'check_circle' : 'warning'}</span>
              {ok ? `Ready to import ${plural(report.counts.ok, 'rows')}` : `${plural(report.counts.errors, 'rows')} ${report.counts.errors === 1 ? 'needs' : 'need'} fixing`}
            </div>
            <p className="font-body-md ml-8 opacity-90">
              {report.counts.rows} rows checked · {report.counts.ok} OK · {report.counts.errors} with errors
            </p>
          </div>

          {report.errors.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-title-md font-bold text-on-surface">Fix these rows, then check again</h2>
              <p className="text-on-surface-variant font-body-sm -mt-2">Row numbers match your spreadsheet (row 1 is the header).</p>
              
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                {report.errors.map((e, i) => (
                  <div key={e.row} className={`flex items-start gap-4 p-4 ${i !== report.errors.length - 1 ? 'border-b border-outline-variant' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-error-container text-on-error-container flex items-center justify-center font-bold text-sm shrink-0">
                      {e.row}
                    </div>
                    <div className="flex-1 font-body-md mt-2 text-on-surface font-semibold">{e.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.preview.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <h2 className="font-title-md font-bold text-on-surface">{ok ? 'Will be added' : 'Rows that are OK'}</h2>
              
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                {report.preview.map((x, i) => (
                  <div key={x.row} className={`flex items-start gap-4 p-4 ${i !== report.preview.length - 1 ? 'border-b border-outline-variant' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-[#e3f4f2] text-[#0b6f66] flex items-center justify-center font-bold text-sm shrink-0">
                      {x.row}
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="font-body-md text-on-surface">
                        <span className="font-bold">{x.name}</span> <span className="text-on-surface-variant px-1">•</span> <span className="font-mono text-sm">{prettyPhone(x.phone)}</span>
                      </div>
                      <div className="font-body-sm text-on-surface-variant">
                        {kind === 'students' ? (
                          <>
                            {x.class}, roll {x.roll} <span className="px-1">•</span> parent {x.parentName} {x.parentExists && <span className="text-primary font-bold">(already registered)</span>}
                          </>
                        ) : (
                          <>
                            {x.subject} <span className="px-1">•</span> {x.class}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ok && (
            <button className="flex items-center justify-center gap-2 h-14 px-8 mt-4 rounded-xl bg-[#0b6f66] text-white font-title-md font-bold hover:bg-[#095c55] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none" disabled={busy} onClick={commit}>
              {busy ? 'Importing...' : `Import ${plural(report.counts.ok, 'rows')}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

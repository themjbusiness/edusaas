import { useState } from 'react';
import { post } from '../../lib/api';
import { prettyPhone } from '../../lib/format';
import { useToast } from '../../ui';

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

export function CollegeAdminCsvImport({ args }: { args?: string[] }) {
  const kind = args?.[0] === 'teachers' ? 'teachers' : 'students';
  const toast = useToast();
  
  const [csv, setCsv] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [done, setDone] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function check() {
    if (!csv.trim()) { setError('Please paste or select a CSV file first.'); return; }
    setBusy(true); setError(''); setDone(null);
    try { setReport(await post<Report>('admin/imports', { kind, csv })); } 
    catch (e) { setError((e as Error).message); setReport(null); }
    setBusy(false);
  }

  async function commit() {
    if (!report) return;
    setBusy(true);
    try { 
      const r = await post<{ created: Record<string, number> }>(`admin/imports/${report.id}/commit`); 
      setDone(r.created); setReport(null); setCsv(''); 
    }
    catch (e) { toast((e as Error).message); }
    setBusy(false);
  }

  const ok = report && !report.errors.length;

  return (
    <main className="flex flex-col relative w-full pt-16 bg-surface px-margin-mobile pb-safe min-h-screen">
      <div className="flex flex-col w-full pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col gap-space-sm pt-space-sm pb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
            </span>
            <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-semibold">Bulk Provisioning</span>
          </div>
          <div>
            <h1 className="font-headline-lg-mobile text-[24px] text-primary font-bold">Import Data</h1>
            <p className="font-body-md text-[14px] text-on-surface-variant mt-1">
              Add a whole class, or all your teachers, from a spreadsheet saved as CSV.
            </p>
          </div>
        </div>
        
        {/* PILL TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-space-md no-scrollbar">
          <a href="#/import/students" className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-md text-[14px] font-bold shadow-sm shrink-0 ${kind === 'students' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span>Students and parents</span>
          </a>
          <a href="#/import/teachers" className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-md text-[14px] font-bold shadow-sm shrink-0 ${kind === 'teachers' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span>Teachers</span>
          </a>
        </div>

        {/* Import Instructions & Upload Area */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col gap-4 mb-space-md">
          <ol className="list-decimal pl-5 space-y-2 font-body-md text-[14px] text-on-surface">
            <li>
              <a href={'data:text/csv;charset=utf-8,' + encodeURIComponent(TEMPLATES[kind])} download={`edusaas-${kind}-template.csv`} className="text-secondary font-semibold hover:underline">Download the template</a> and fill it in (Excel: File → Save as → CSV).
            </li>
            <li>Choose the file, or paste its contents below.</li>
            <li><b>Check file</b>. Nothing is saved until you press <b>Import</b>.</li>
          </ol>

          <div className="flex flex-col gap-2 pt-2">
            <input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const rd = new FileReader(); rd.onload = () => setCsv(String(rd.result)); rd.readAsText(f);
            }} className="w-full text-[13px] text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[13px] file:font-semibold file:bg-primary-container file:text-on-primary hover:file:bg-primary hover:file:text-white" />
            
            <textarea 
              className="w-full h-32 p-3 rounded-xl bg-surface-container-low text-on-surface font-mono text-[12px] border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary resize-none" 
              placeholder={TEMPLATES[kind].split('\n')[0]} 
              value={csv} 
              onChange={(e) => setCsv(e.target.value)}
            />
          </div>

          <button onClick={check} disabled={busy} className="w-full h-12 bg-surface-container-highest text-on-surface font-label-lg text-[14px] font-bold rounded-xl shadow-sm active:opacity-90 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            {busy && !report ? 'Checking…' : 'Check file'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-error-container text-on-error-container font-body-sm text-[13px] font-semibold flex items-start gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {done && (
          <div className="mb-4 p-4 rounded-xl bg-[#E3F5EC] text-[#047857] flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 font-label-md text-[14px] font-bold">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Imported Successfully</span>
            </div>
            <p className="font-body-sm text-[13px] opacity-90 pl-7">
              {Object.entries(done).map(([k, v]) => plural(v, k)).join(', ')} created. They can sign in with their numbers now.
            </p>
          </div>
        )}

        {/* Validation Report Area */}
        {report && (
          <div className="flex flex-col gap-space-md animate-[fadeIn_0.3s_ease-out]">
            {/* Status Header */}
            <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm ${ok ? 'bg-[#E3F5EC]' : 'bg-error-container/40'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[24px] ${ok ? 'text-[#047857]' : 'text-error'}`}>
                  {ok ? 'task_alt' : 'warning'}
                </span>
                <div>
                  <h3 className={`font-label-lg text-[14px] font-bold ${ok ? 'text-[#047857]' : 'text-error'}`}>
                    {ok ? `Ready to import ${plural(report.counts.ok, 'rows')}` : `${plural(report.counts.errors, 'rows')} ${report.counts.errors === 1 ? 'needs' : 'need'} fixing`}
                  </h3>
                  <p className={`font-body-sm text-[13px] ${ok ? 'text-[#047857]/80' : 'text-error/80'}`}>
                    {report.counts.rows} rows checked · {report.counts.ok} OK · {report.counts.errors} with errors
                  </p>
                </div>
              </div>
            </div>

            {/* Error List */}
            {report.errors.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="font-label-sm text-[11px] text-error uppercase tracking-wider font-bold">Fix these rows, then check again</h4>
                <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-error/20">
                  {report.errors.map((e, i) => (
                    <div key={e.row}>
                      <div className="p-3 flex items-start gap-3 bg-error-container/10">
                        <div className="w-8 h-8 rounded-lg bg-error-container text-error font-label-md text-[14px] font-bold flex items-center justify-center shrink-0">
                          {e.row}
                        </div>
                        <p className="font-body-sm text-[13px] text-on-surface mt-1.5">{e.message}</p>
                      </div>
                      {i < report.errors.length - 1 && <div className="h-[1px] bg-error/10"></div>}
                    </div>
                  ))}
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant px-1 mt-1">Row numbers match your spreadsheet (row 1 is the header).</p>
              </div>
            )}

            {/* Valid Rows Preview */}
            {report.preview.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className={`font-label-sm text-[11px] uppercase tracking-wider font-bold ${ok ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {ok ? 'Will be added' : 'Rows that are OK'}
                </h4>
                <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                  {report.preview.map((x, i) => (
                    <div key={x.row}>
                      <div className="p-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary-container/40 text-secondary font-label-md text-[14px] font-bold flex items-center justify-center shrink-0">
                          {x.row}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-label-md text-[14px] font-bold text-on-surface">{x.name}</span>
                            <span className="font-body-sm text-[12px] text-on-surface-variant font-mono">{prettyPhone(x.phone)}</span>
                          </div>
                          <span className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            {kind === 'students' ? `${x.class}, roll ${x.roll} · parent ${x.parentName}${x.parentExists ? ' (already registered)' : ''}` : `${x.subject} · ${x.class}`}
                          </span>
                        </div>
                      </div>
                      {i < report.preview.length - 1 && <div className="h-[1px] bg-surface-container-high mx-3"></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {ok && (
              <div className="pt-2">
                <button onClick={commit} disabled={busy} className="w-full h-14 bg-primary text-on-primary rounded-xl font-label-lg text-[16px] font-bold shadow-md flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-50 transition-opacity">
                  <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  {busy ? 'Importing…' : `Import ${plural(report.counts.ok, 'rows')}`}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}

import { usePatientLanguage } from '../../context/PatientLanguageContext'

function LanguageSelector({ compact = false }) {
  const { language, setLanguage, languages, t } = usePatientLanguage()

  return (
    <div
      className={
        compact
          ? 'flex items-center gap-2'
          : 'w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
      }
    >
      {!compact && (
        <div className="mb-2">
          <p className="text-sm font-bold text-slate-800">
            🌐 {t('Language')}
          </p>
          <p className="text-xs text-slate-500">
            {t('Select language')}
          </p>
        </div>
      )}

      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t('Language')}
        className={
          compact
            ? 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500'
            : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
        }
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label} — {item.english}
          </option>
        ))}
      </select>
    </div>
  )
}

export default LanguageSelector

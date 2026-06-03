import { useAppStore } from '@/stores/app-store'
import { useYearData } from '@/hooks/use-year-data'
import { useProfiles } from '@/hooks/use-profiles'
import { Money } from '@/components/shared/money'
import { catColor, MONTHS } from '@/lib/constants'
import { money } from '@/lib/money'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

export default function AnnualPage() {
  const year    = useAppStore(s => s.year)
  const month   = useAppStore(s => s.month)
  const setYear = useAppStore(s => s.setYear)
  const currentProfileId = useAppStore(s => s.currentProfileId)
  const { data: profiles } = useProfiles()
  const profile = profiles?.find(p => p.id === currentProfileId)

  const yearData = useYearData()

  if (!yearData) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <span className="text-[14px] text-bmuted">Loading…</span>
      </div>
    )
  }

  const { incomeCats, expenseCats, incTotals, expTotals, net, cumulative, incYear, expYear } = yearData
  const incCats = Object.keys(incomeCats)
  const expCats = Object.keys(expenseCats)

  // ── CSV export ────────────────────────────────────────────────
  function handleExport() {
    const rows: (string | number)[][] = []
    const profileName = profile?.name ?? 'Budget'
    rows.push([`Budgetarko — ${profileName} — ${year}`])
    rows.push(['Category', ...MONTHS, 'Year'])
    rows.push(['INCOME'])
    incCats.forEach(c =>
      rows.push([c, ...incomeCats[c].map(v => v.toFixed(2)), incomeCats[c].reduce((a, b) => a + b, 0).toFixed(2)])
    )
    rows.push(['Sum income', ...incTotals.map(v => v.toFixed(2)), incYear.toFixed(2)])
    rows.push(['EXPENSES'])
    expCats.forEach(c =>
      rows.push([c, ...expenseCats[c].map(v => v.toFixed(2)), expenseCats[c].reduce((a, b) => a + b, 0).toFixed(2)])
    )
    rows.push(['Sum expenses', ...expTotals.map(v => v.toFixed(2)), expYear.toFixed(2)])
    rows.push(['Net (month)',  ...net.map(v => v.toFixed(2)),        (incYear - expYear).toFixed(2)])
    rows.push(['Cumulative',   ...cumulative.map(v => v.toFixed(2)), cumulative[11].toFixed(2)])

    const csv = rows
      .map(r => r.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `budgetarko-${profileName.toLowerCase()}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Table helpers ─────────────────────────────────────────────
  function Cell({
    value,
    cur,
    strong,
    sign,
    color,
  }: {
    value: number
    cur?: boolean
    strong?: boolean
    sign?: boolean
    color?: string
  }) {
    const empty = Math.abs(value) < 0.005
    return (
      <td
        className={`px-3 py-[9px] text-right text-[12.5px] tabular-nums ${cur ? 'bg-bgreen-soft/60' : ''} ${strong ? 'font-bold' : 'font-medium'}`}
      >
        {empty ? (
          <span className="text-bmuted">·</span>
        ) : (
          <span style={{ color }}>
            {sign
              ? money(value, { sign: true, auto: true })
              : money(value, { auto: true })}
          </span>
        )}
      </td>
    )
  }

  function YearCell({ value, sign, color, strong }: { value: number; sign?: boolean; color?: string; strong?: boolean }) {
    return (
      <td
        className={`px-3 py-[9px] text-right text-[12.5px] tabular-nums ${strong ? 'font-bold' : 'font-medium'}`}
      >
        {Math.abs(value) < 0.005 ? (
          <span className="text-bmuted">·</span>
        ) : (
          <span style={{ color }}>
            {sign ? money(value, { sign: true, auto: true }) : money(value, { auto: true })}
          </span>
        )}
      </td>
    )
  }

  return (
    <div className="min-h-full p-7">
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
            Annual matrix · {profile?.name}
          </div>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
            Annual overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Year switcher */}
          <div className="flex items-center gap-2 rounded-[11px] border border-bline bg-bsurface-2 px-3 py-[7px]">
            <button
              type="button"
              onClick={() => setYear(year - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-[7px] text-bink-2 hover:bg-bline"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="mono-num w-[38px] text-center text-[14px] font-bold text-bink">
              {year}
            </span>
            <button
              type="button"
              onClick={() => setYear(year + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-[7px] text-bink-2 hover:bg-bline"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-[11px] border border-bline bg-bsurface px-3 py-[9px] text-[13px] font-semibold text-bink-2 hover:bg-bsurface-2"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Matrix table ── */}
      <div className="overflow-x-auto rounded-[20px] border border-bline bg-bsurface">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-bline">
              <th className="sticky left-0 z-10 bg-bsurface px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
                Category
              </th>
              {MONTHS.map((m, i) => (
                <th
                  key={m}
                  className={`min-w-[64px] px-3 py-3 text-right text-[12px] font-bold uppercase tracking-[0.04em] ${
                    i === month - 1 ? 'bg-bgreen-soft/60 text-bgreen' : 'text-bmuted'
                  }`}
                >
                  {m}
                </th>
              ))}
              <th className="px-3 py-3 text-right text-[12px] font-bold uppercase tracking-[0.04em] text-bmuted">
                Year
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Income section */}
            <tr className="border-b border-bline bg-bgreen-soft/30">
              <td
                colSpan={14}
                className="sticky left-0 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-bgreen"
              >
                Income
              </td>
            </tr>
            {incCats.map(c => (
              <tr key={'i' + c} className="border-b border-bline-2 hover:bg-bsurface-2">
                <td className="sticky left-0 bg-bsurface px-4 py-[9px] text-[13px] font-medium text-bink hover:bg-bsurface-2">
                  <span className="flex items-center gap-2">
                    <i
                      className="h-[7px] w-[7px] shrink-0 rounded-full"
                      style={{ background: catColor(c) }}
                    />
                    {c}
                  </span>
                </td>
                {incomeCats[c].map((v, i) => (
                  <Cell key={i} value={v} cur={i === month - 1} />
                ))}
                <YearCell value={incomeCats[c].reduce((a, b) => a + b, 0)} />
              </tr>
            ))}
            {incCats.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-3 text-[13px] text-bmuted">
                  No income entries.
                </td>
              </tr>
            )}
            {/* Income total */}
            <tr className="border-b border-bline bg-bgreen-soft/20">
              <td className="sticky left-0 bg-bgreen-soft/20 px-4 py-[9px] text-[12.5px] font-bold text-bgreen">
                ∑ Income
              </td>
              {incTotals.map((v, i) => (
                <Cell key={i} value={v} cur={i === month - 1} strong color="var(--green)" />
              ))}
              <YearCell value={incYear} strong color="var(--green)" />
            </tr>

            {/* Expense section */}
            <tr className="border-b border-bline bg-bred-soft/30">
              <td
                colSpan={14}
                className="sticky left-0 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-bred"
              >
                Expenses
              </td>
            </tr>
            {expCats.map(c => (
              <tr key={'e' + c} className="border-b border-bline-2 hover:bg-bsurface-2">
                <td className="sticky left-0 bg-bsurface px-4 py-[9px] text-[13px] font-medium text-bink hover:bg-bsurface-2">
                  <span className="flex items-center gap-2">
                    <i
                      className="h-[7px] w-[7px] shrink-0 rounded-full"
                      style={{ background: catColor(c) }}
                    />
                    {c}
                  </span>
                </td>
                {expenseCats[c].map((v, i) => (
                  <Cell key={i} value={v} cur={i === month - 1} />
                ))}
                <YearCell value={expenseCats[c].reduce((a, b) => a + b, 0)} />
              </tr>
            ))}
            {expCats.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-3 text-[13px] text-bmuted">
                  No expense entries.
                </td>
              </tr>
            )}
            {/* Expense total */}
            <tr className="border-b border-bline bg-bred-soft/20">
              <td className="sticky left-0 bg-bred-soft/20 px-4 py-[9px] text-[12.5px] font-bold text-bred">
                ∑ Expenses
              </td>
              {expTotals.map((v, i) => (
                <Cell key={i} value={v} cur={i === month - 1} strong color="var(--red)" />
              ))}
              <YearCell value={expYear} strong color="var(--red)" />
            </tr>

            {/* Net row */}
            <tr className="border-b border-bline">
              <td className="sticky left-0 bg-bsurface px-4 py-[9px] text-[12.5px] font-bold text-bink">
                Net (month)
              </td>
              {net.map((v, i) => (
                <Cell
                  key={i}
                  value={v}
                  cur={i === month - 1}
                  strong
                  sign
                  color={v >= 0 ? 'var(--green)' : 'var(--red)'}
                />
              ))}
              <YearCell
                value={incYear - expYear}
                strong
                sign
                color={(incYear - expYear) >= 0 ? 'var(--green)' : 'var(--red)'}
              />
            </tr>

            {/* Cumulative row */}
            <tr>
              <td className="sticky left-0 bg-bsurface px-4 py-[9px] text-[12.5px] font-semibold text-bink-2">
                Cumulative
              </td>
              {cumulative.map((v, i) => (
                <Cell
                  key={i}
                  value={v}
                  cur={i === month - 1}
                  sign
                  color={v >= 0 ? 'var(--ink-2)' : 'var(--red)'}
                />
              ))}
              <YearCell
                value={cumulative[11] ?? 0}
                sign
                color={(cumulative[11] ?? 0) >= 0 ? 'var(--ink-2)' : 'var(--red)'}
              />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Footer stats ── */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {[
          { label: 'Total income',   value: incYear,            color: 'var(--green)' },
          { label: 'Total expenses', value: expYear,            color: 'var(--red)'   },
          { label: 'Year result',    value: incYear - expYear,  color: (incYear - expYear) >= 0 ? 'var(--green)' : 'var(--red)', sign: true },
        ].map(({ label, value, color, sign }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-[16px] border border-bline bg-bsurface px-5 py-4"
          >
            <span className="text-[13px] font-semibold text-bink-2">{label}</span>
            <Money
              value={value}
              sign={sign}
              className="text-[15px] font-bold"
              style={{ color }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

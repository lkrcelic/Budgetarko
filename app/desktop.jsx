// desktop.jsx — laptop review experience. Exposes window.DesktopApp
(function () {
  const { useState, useMemo } = React;
  const { Money, Avatar, Icon, catColor, money, KIND_META, toast } = UI;

  // ---------- sidebar ----------
  function Sidebar({ state, view, setView }) {
    const profile = state.profiles.find((p) => p.id === state.currentProfile);
    const nav = [
      { id: 'overview', label: 'Monthly', icon: 'calendar' },
      { id: 'annual', label: 'Annual matrix', icon: 'grid' },
      { id: 'installments', label: 'Installments', icon: 'layers' },
      { id: 'categories', label: 'Categories', icon: 'tag' },
    ];
    return (
      <aside className="d-side">
        <div className="d-brand">
          <span className="d-brand-mark"><Icon name="wallet" size={18} color="#fff" /></span>
          <span className="d-brand-name">Budgetarko</span>
        </div>

        <div className="d-prof">
          <div className="d-prof-cur">
            <Avatar profile={profile} size={34} />
            <div><div className="d-prof-name">{profile.name}</div><div className="d-prof-sub">Personal budget</div></div>
          </div>
          <div className="d-prof-switch">
            {state.profiles.map((p) => (
              <button key={p.id} className={'d-prof-btn' + (p.id === state.currentProfile ? ' is-on' : '')}
                onClick={() => Budget.setProfile(p.id)}><Avatar profile={p} size={22} />{p.name}</button>
            ))}
          </div>
        </div>

        <nav className="d-nav">
          {nav.map((n) => (
            <button key={n.id} className={'d-nav-btn' + (view === n.id ? ' is-on' : '')} onClick={() => setView(n.id)}>
              <Icon name={n.icon} size={18} />{n.label}
            </button>
          ))}
        </nav>

        <div className="d-side-foot">
          <div className="d-sync"><span className="d-sync-dot" /> Synced with phone</div>
        </div>
      </aside>
    );
  }

  // ---------- year switch ----------
  function YearSwitch({ year }) {
    return (
      <div className="d-year">
        <button onClick={() => Budget.setYear(year - 1)}><Icon name="chevL" size={15} /></button>
        <span className="mono-num">{year}</span>
        <button onClick={() => Budget.setYear(year + 1)}><Icon name="chevR" size={15} /></button>
      </div>
    );
  }

  // ================= MONTHLY OVERVIEW =================
  function Overview({ state }) {
    const { year, month } = state;
    const y = useMemo(() => Budget.buildYear(year), [state._v, year, state.currentProfile]);
    const items = useMemo(() => Budget.monthItems(year, month), [state._v, year, month, state.currentProfile]);
    const insts = useMemo(() => Budget.activeInstallments(year, month), [state._v, year, month, state.currentProfile]);
    const net = y.net[month - 1], inc = y.incTotals[month - 1], exp = y.expTotals[month - 1];
    const positive = net >= 0;

    // expenses by category
    const byCat = {};
    items.filter((it) => !it.income).forEach((it) => { byCat[it.entry.category] = (byCat[it.entry.category] || 0) + it.amount; });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(1, ...cats.map((c) => c[1]));
    const incomes = items.filter((it) => it.income).sort((a, b) => b.amount - a.amount);
    const expenses = items.filter((it) => !it.income).sort((a, b) => b.amount - a.amount);
    const instThis = insts.filter((p) => p.paid > 0 && !p.done && month - 1 >= 0 && (year * 12 + month - 1) >= p.start && (year * 12 + month - 1) <= p.end);

    return (
      <div className="d-page">
        <div className="d-page-head">
          <div>
            <div className="d-eyebrow">Monthly overview</div>
            <h1 className="d-title">{Budget.MONTHS_LONG[month - 1]} {year}</h1>
          </div>
          <div className="d-month-nav">
            <button onClick={() => { let m = month - 1, yy = year; if (m < 1) { m = 12; yy--; Budget.setYear(yy); } Budget.setMonth(m); }}><Icon name="chevL" size={16} /></button>
            <div className="d-month-strip">
              {Budget.MONTHS.map((m, i) => (
                <button key={m} className={'d-month-pip' + (month === i + 1 ? ' is-on' : '')} onClick={() => Budget.setMonth(i + 1)}>{m}</button>
              ))}
            </div>
            <button onClick={() => { let m = month + 1, yy = year; if (m > 12) { m = 1; yy++; Budget.setYear(yy); } Budget.setMonth(m); }}><Icon name="chevR" size={16} /></button>
          </div>
        </div>

        {/* hero net + stats */}
        <div className="d-ov-top">
          <div className={'d-net ' + (positive ? 'is-pos' : 'is-neg')}>
            <div className="d-net-lbl">{positive ? 'Surplus this month' : 'Deficit this month'}</div>
            <Money value={net} sign className="d-net-val" />
            <div className="d-net-bar">
              <span className="d-net-inc" style={{ flex: inc }} />
              <span className="d-net-exp" style={{ flex: exp }} />
            </div>
            <div className="d-net-legend">
              <span><i style={{ background: 'var(--green)' }} />Income <Money value={inc} /></span>
              <span><i style={{ background: 'var(--red)' }} />Expenses <Money value={exp} /></span>
            </div>
          </div>

          <div className="d-bycat">
            <div className="d-card-h">Expenses by category</div>
            <div className="d-bars">
              {cats.map(([c, v]) => (
                <div className="d-bar-row" key={c}>
                  <span className="d-bar-lbl"><i style={{ background: catColor(c) }} />{c}</span>
                  <div className="d-bar-track"><span style={{ width: (v / maxCat * 100) + '%', background: catColor(c) }} /></div>
                  <Money value={v} className="d-bar-val" />
                </div>
              ))}
              {cats.length === 0 && <div className="d-empty">No expenses this month.</div>}
            </div>
          </div>
        </div>

        {/* installments entering this month */}
        {instThis.length > 0 && (
          <div className="d-card d-inst-card">
            <div className="d-card-h">Installments due this month</div>
            <div className="d-inst-grid">
              {instThis.map((p) => {
                const n = (year * 12 + month - 1) - p.start + 1;
                return (
                  <div className="d-inst-item" key={p.entry.id}>
                    <div className="d-inst-row1"><span>{p.entry.description}</span><Money value={p.per} cents /></div>
                    <div className="d-inst-bar"><span style={{ width: (n / p.total * 100) + '%' }} /></div>
                    <div className="d-inst-meta">Installment {n} of {p.total}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* item lists */}
        <div className="d-lists">
          <ItemList title="Income" items={incomes} state={state} accent="var(--green)" />
          <ItemList title="Expenses" items={expenses} state={state} accent="var(--red)" />
        </div>
      </div>
    );
  }

  function ItemList({ title, items, state, accent }) {
    return (
      <div className="d-card">
        <div className="d-card-h" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{title}</span><span className="d-count">{items.length}</span>
        </div>
        <div className="d-itemlist">
          {items.map((it, i) => (
            <div className="d-il-row" key={it.entry.id + '' + i}>
              <span className="d-il-dot" style={{ background: catColor(it.entry.category) }} />
              <span className="d-il-main">
                <span className="d-il-desc">{it.entry.description || it.entry.category}</span>
                <span className="d-il-sub">{it.entry.category}{it.inst ? ` · installment ${it.inst.n}/${it.inst.of}` : ''}{it.entry.kind === 'subscription' ? ' · subscription' : ''}</span>
              </span>
              <Money value={it.amount} cents={!Number.isInteger(it.amount)} className="d-il-amt" style={{ color: accent }} />
              <button className="d-il-del" title="Delete" onClick={() => { Budget.deleteEntry(it.entry.id); toast('Entry deleted'); }}><Icon name="trash" size={15} /></button>
            </div>
          ))}
          {items.length === 0 && <div className="d-empty">Nothing here.</div>}
        </div>
      </div>
    );
  }

  // ================= ANNUAL MATRIX =================
  function Annual({ state }) {
    const { year, month } = state;
    const y = useMemo(() => Budget.buildYear(year), [state._v, year, state.currentProfile]);
    const incCats = Object.keys(y.incomeCats);
    const expCats = Object.keys(y.expenseCats);
    const profile = state.profiles.find((p) => p.id === state.currentProfile);

    const cell = (v, opts = {}) => {
      const empty = !v || Math.abs(v) < 0.005;
      return <td className={'mx-c' + (opts.cur ? ' mx-cur' : '') + (opts.strong ? ' mx-strong' : '')} key={opts.k}>
        {empty ? <span className="mx-zero">·</span> : <Money value={v} className={opts.cls} sign={opts.sign} />}
      </td>;
    };

    const Row = ({ label, data, sub, kind }) => (
      <tr className={'mx-row ' + (kind || '')}>
        <td className="mx-h"><span className="mx-h-dot" style={{ background: catColor(label) }} />{label}{sub ? <span className="mx-h-sub">{sub}</span> : null}</td>
        {data.map((v, i) => cell(v, { cur: i === month - 1, k: i }))}
        <td className="mx-c mx-year">{!data.reduce((a, b) => a + b, 0) ? <span className="mx-zero">·</span> : <Money value={data.reduce((a, b) => a + b, 0)} />}</td>
      </tr>
    );

    return (
      <div className="d-page">
        <div className="d-page-head">
          <div>
            <div className="d-eyebrow">Annual matrix · {profile.name}</div>
            <h1 className="d-title">Annual overview</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <YearSwitch year={year} />
            <button className="d-export" onClick={() => exportExcel(state)}><Icon name="download" size={16} />Export</button>
          </div>
        </div>

        <div className="d-matrix-wrap">
          <table className="d-matrix">
            <thead>
              <tr>
                <th className="mx-corner">Category</th>
                {Budget.MONTHS.map((m, i) => <th key={m} className={'mx-mh' + (i === month - 1 ? ' mx-cur' : '')}>{m}</th>)}
                <th className="mx-yh">Year</th>
              </tr>
            </thead>
            <tbody>
              <tr className="mx-section"><td colSpan="14">Income</td></tr>
              {incCats.map((c) => <Row key={'i' + c} label={c} data={y.incomeCats[c]} />)}
              <tr className="mx-total mx-total-inc">
                <td className="mx-h">∑ Income</td>
                {y.incTotals.map((v, i) => cell(v, { cur: i === month - 1, strong: true, k: i }))}
                <td className="mx-c mx-year mx-strong"><Money value={y.incYear} /></td>
              </tr>

              <tr className="mx-section"><td colSpan="14">Expenses</td></tr>
              {expCats.map((c) => <Row key={'e' + c} label={c} data={y.expenseCats[c]} />)}
              <tr className="mx-total mx-total-exp">
                <td className="mx-h">∑ Expenses</td>
                {y.expTotals.map((v, i) => cell(v, { cur: i === month - 1, strong: true, k: i }))}
                <td className="mx-c mx-year mx-strong"><Money value={y.expYear} /></td>
              </tr>

              <tr className="mx-net">
                <td className="mx-h">Net (month)</td>
                {y.net.map((v, i) => (
                  <td key={i} className={'mx-c mx-strong' + (i === month - 1 ? ' mx-cur' : '')}>
                    {Math.abs(v) < 0.005 ? <span className="mx-zero">·</span> :
                      <Money value={v} sign style={{ color: v >= 0 ? 'var(--green)' : 'var(--red)' }} />}
                  </td>
                ))}
                <td className="mx-c mx-year mx-strong"><Money value={y.incYear - y.expYear} sign style={{ color: (y.incYear - y.expYear) >= 0 ? 'var(--green)' : 'var(--red)' }} /></td>
              </tr>
              <tr className="mx-cum">
                <td className="mx-h">Cumulative</td>
                {y.cumulative.map((v, i) => (
                  <td key={i} className={'mx-c' + (i === month - 1 ? ' mx-cur' : '')}>
                    <Money value={v} sign style={{ color: v >= 0 ? 'var(--ink-2)' : 'var(--red)' }} />
                  </td>
                ))}
                <td className="mx-c mx-year"><Money value={y.cumulative[11]} sign /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="d-matrix-foot">
          <div className="d-foot-stat"><span>Total income</span><Money value={y.incYear} className="pos" /></div>
          <div className="d-foot-stat"><span>Total expenses</span><Money value={y.expYear} /></div>
          <div className="d-foot-stat"><span>Year result</span><Money value={y.incYear - y.expYear} sign style={{ color: (y.incYear - y.expYear) >= 0 ? 'var(--green)' : 'var(--red)' }} /></div>
        </div>
      </div>
    );
  }

  // ================= INSTALLMENTS =================
  function Installments({ state }) {
    const { year, month } = state;
    const refIdx = year * 12 + (month - 1);
    const plans = useMemo(() => Budget.activeInstallments(year, month), [state._v, year, month, state.currentProfile]);
    return (
      <div className="d-page">
        <div className="d-page-head">
          <div><div className="d-eyebrow">Installments</div><h1 className="d-title">Card payment plans</h1></div>
        </div>
        <div className="d-plan-list">
          {plans.map((p) => {
            const per = p.per;
            const months = [];
            for (let i = 0; i < p.total; i++) months.push(p.start + i);
            return (
              <div className="d-plan" key={p.entry.id}>
                <div className="d-plan-head">
                  <div>
                    <div className="d-plan-name">{p.entry.description}</div>
                    <div className="d-plan-sub">{money(p.entry.amount, { auto: true })} · {p.total} installments · {money(per, { cents: true })}/mo</div>
                  </div>
                  <div className={'d-plan-badge' + (p.done ? ' is-done' : '')}>{p.done ? 'Completed' : `${p.paid}/${p.total} paid`}</div>
                </div>
                <div className="d-plan-track">
                  {months.map((mi, i) => {
                    const my = Math.floor(mi / 12), mm = (mi % 12);
                    const paid = mi < refIdx, current = mi === refIdx, future = mi > refIdx;
                    return (
                      <div key={i} className={'d-plan-cell' + (paid ? ' paid' : '') + (current ? ' current' : '') + (future ? ' future' : '')}>
                        <span className="d-plan-mo">{Budget.MONTHS[mm]}{mm === 0 || i === 0 ? " '" + String(my).slice(2) : ''}</span>
                        <span className="d-plan-amt">{money(per, { cents: true })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {plans.length === 0 && <div className="d-empty d-empty-big">No active installment plans for {state.profiles.find((p) => p.id === state.currentProfile).name}.</div>}
        </div>
      </div>
    );
  }

  // ================= CATEGORIES =================
  function Categories({ state }) {
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('expense');
    const group = (type) => state.categories.filter((c) => c.type === type);
    return (
      <div className="d-page">
        <div className="d-page-head">
          <div><div className="d-eyebrow">Categories</div><h1 className="d-title">Manage categories</h1></div>
        </div>
        <div className="d-cat-add">
          <input placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <UI.Segmented value={newType} onChange={setNewType} options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} />
          <button onClick={() => { if (newName.trim()) { Budget.addCategory({ name: newName.trim(), type: newType, active: true }); toast('Category added'); setNewName(''); } }}>Add category</button>
        </div>
        <div className="d-cat-cols">
          {['income', 'expense'].map((t) => (
            <div className="d-card" key={t}>
              <div className="d-card-h">{t === 'income' ? 'Income' : 'Expense'} categories</div>
              <div className="d-cat-list">
                {group(t).map((c, i) => (
                  <div className={'d-cat-row' + (c.active ? '' : ' is-off')} key={c.name + i}>
                    <span className="d-cat-dot" style={{ background: catColor(c.name) }} />
                    <span className="d-cat-name">{c.name}</span>
                    <button className={'d-toggle' + (c.active ? ' is-on' : '')} onClick={() => Budget.toggleCategory(c.name, c.type)}>
                      <span className="d-toggle-knob" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Excel/CSV export ----------
  function exportExcel(state) {
    const y = Budget.buildYear(state.year);
    const rows = [];
    const profile = state.profiles.find((p) => p.id === state.currentProfile).name;
    rows.push([`Budgetarko — ${profile} — ${state.year}`]);
    rows.push(['Category', ...Budget.MONTHS, 'Year']);
    rows.push(['INCOME']);
    Object.keys(y.incomeCats).forEach((c) => rows.push([c, ...y.incomeCats[c].map((v) => v.toFixed(2)), y.incomeCats[c].reduce((a, b) => a + b, 0).toFixed(2)]));
    rows.push(['Sum income', ...y.incTotals.map((v) => v.toFixed(2)), y.incYear.toFixed(2)]);
    rows.push(['EXPENSES']);
    Object.keys(y.expenseCats).forEach((c) => rows.push([c, ...y.expenseCats[c].map((v) => v.toFixed(2)), y.expenseCats[c].reduce((a, b) => a + b, 0).toFixed(2)]));
    rows.push(['Sum expenses', ...y.expTotals.map((v) => v.toFixed(2)), y.expYear.toFixed(2)]);
    rows.push(['Net (month)', ...y.net.map((v) => v.toFixed(2)), (y.incYear - y.expYear).toFixed(2)]);
    rows.push(['Cumulative', ...y.cumulative.map((v) => v.toFixed(2)), y.cumulative[11].toFixed(2)]);
    const csv = rows.map((r) => r.map((c) => /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `budgetarko-${profile}-${state.year}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast('Exported to spreadsheet');
  }

  // ================= ROOT =================
  function DesktopApp() {
    const state = UI.useStore();
    const [view, setView] = useState('annual');
    return (
      <div className="d-root">
        <Sidebar state={state} view={view} setView={setView} />
        <main className="d-main">
          {view === 'overview' && <Overview state={state} />}
          {view === 'annual' && <Annual state={state} />}
          {view === 'installments' && <Installments state={state} />}
          {view === 'categories' && <Categories state={state} />}
        </main>
      </div>
    );
  }

  window.DesktopApp = DesktopApp;
})();

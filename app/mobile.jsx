// mobile.jsx — phone experience: home + add-entry flow. Exposes window.MobileApp
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const { Money, Avatar, Segmented, MonthField, Icon, catColor, KIND_META, toast } = UI;

  // ---------- numeric pad ----------
  function AmountPad({ onKey, onClose }) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
    return (
      <div className="pad-wrap">
        <div className="pad-grab" />
        <div className="pad-grid">
          {keys.map((k) => (
            <button key={k} className={'pad-key' + (k === 'del' ? ' pad-del' : '')} onClick={() => onKey(k)}>
              {k === 'del' ? <Icon name="chevL" size={22} /> : k}
            </button>
          ))}
        </div>
        <button className="pad-done" onClick={onClose}>Done</button>
      </div>
    );
  }

  // ---------- recent / item row ----------
  function ItemRow({ it, onClick }) {
    const inc = it.income;
    return (
      <button className="m-item" onClick={onClick}>
        <span className="m-item-dot" style={{ background: catColor(it.entry.category) }} />
        <span className="m-item-main">
          <span className="m-item-desc">{it.entry.description || it.entry.category}</span>
          <span className="m-item-sub">{it.entry.category}{it.inst ? ` · ${it.inst.n}/${it.inst.of}` : ''}</span>
        </span>
        <Money value={inc ? it.amount : -it.amount} sign cents={!Number.isInteger(it.amount)} className="m-item-amt"
          style={{ color: inc ? 'var(--green)' : 'var(--ink)' }} />
      </button>
    );
  }

  // ================= HOME =================
  function Home({ state, onAdd, year, month }) {
    const y = useMemo(() => Budget.buildYear(year), [state._v, year, state.currentProfile]);
    const items = useMemo(() => Budget.monthItems(year, month), [state._v, year, month, state.currentProfile]);
    const insts = useMemo(() => Budget.activeInstallments(year, month).filter((x) => !x.done && x.paid > 0), [state._v, year, month, state.currentProfile]);
    const profile = state.profiles.find((p) => p.id === state.currentProfile);
    const net = y.net[month - 1];
    const positive = net >= 0;
    const recent = [...items].sort((a, b) => (a.income === b.income ? 0 : a.income ? -1 : 1)).slice(0, 6);

    return (
      <div className="m-screen">
        <div className="m-head">
          <div>
            <div className="m-eyebrow">Budgetarko</div>
            <div className="m-greeting">Hi, {profile.name}</div>
          </div>
          <button className="m-profile" onClick={() => {
            const ids = state.profiles.map((p) => p.id); const i = ids.indexOf(state.currentProfile);
            Budget.setProfile(ids[(i + 1) % ids.length]);
          }}>
            <Avatar profile={profile} size={38} />
          </button>
        </div>

        {/* month balance card */}
        <div className={'m-balance ' + (positive ? 'is-pos' : 'is-neg')}>
          <div className="m-balance-top">
            <span>{Budget.MONTHS_LONG[month - 1]} {year}</span>
            <span className={'m-pill ' + (positive ? 'pos' : 'neg')}>{positive ? 'Surplus' : 'Deficit'}</span>
          </div>
          <Money value={net} sign className="m-balance-net" />
          <div className="m-balance-split">
            <div><span className="m-mini-lbl">Income</span><Money value={y.incTotals[month - 1]} className="m-mini-val" /></div>
            <div className="m-split-div" />
            <div><span className="m-mini-lbl">Expenses</span><Money value={y.expTotals[month - 1]} className="m-mini-val" /></div>
          </div>
        </div>

        {/* big add */}
        <button className="m-add" onClick={onAdd}>
          <span className="m-add-ico"><Icon name="plus" size={22} color="#fff" /></span>
          Add entry
        </button>

        {/* installments mini */}
        {insts.length > 0 && (
          <div className="m-block">
            <div className="m-block-h"><span>Active installments</span></div>
            <div className="m-inst-list">
              {insts.map((p) => (
                <div className="m-inst" key={p.entry.id}>
                  <div className="m-inst-top">
                    <span className="m-inst-name">{p.entry.description}</span>
                    <Money value={p.per} cents className="m-inst-per" />
                  </div>
                  <div className="m-inst-bar"><span style={{ width: (p.paid / p.total * 100) + '%' }} /></div>
                  <div className="m-inst-meta">{p.paid} of {p.total} paid · <Money value={p.remaining} cents /> left</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* recent */}
        <div className="m-block">
          <div className="m-block-h"><span>This month</span><span className="m-count">{items.length} items</span></div>
          <div className="m-items">
            {recent.map((it, i) => <ItemRow key={i} it={it} />)}
            {items.length === 0 && <div className="m-empty">No entries yet — tap Add entry.</div>}
          </div>
        </div>
      </div>
    );
  }

  // ================= ADD FLOW =================
  const TYPE_CARDS = [
    { kind: 'expense', sub: 'A one-off cost' },
    { kind: 'income', sub: 'Money coming in' },
    { kind: 'card', sub: 'Split across months' },
    { kind: 'subscription', sub: 'Recurring charge' },
  ];

  function AddFlow({ state, year, month, onClose }) {
    const [kind, setKind] = useState(null);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [desc, setDesc] = useState('');
    const [yr, setYr] = useState(year);
    const [mo, setMo] = useState(month);
    const [installments, setInstallments] = useState(6);
    const [startY, setStartY] = useState(year);
    const [startM, setStartM] = useState(null); // null = auto (month+1)
    const [freq, setFreq] = useState('monthly');
    const [padOpen, setPadOpen] = useState(false);
    const [addingCat, setAddingCat] = useState(false);
    const [newCat, setNewCat] = useState('');

    const meta = kind ? KIND_META[kind] : null;
    const isIncome = kind === 'income';
    const cats = kind ? Budget.catsFor(isIncome ? 'income' : 'expense') : [];

    function key(k) {
      setAmount((a) => {
        if (k === 'del') return a.slice(0, -1);
        if (k === '.') return a.includes('.') ? a : (a === '' ? '0.' : a + '.');
        if (a.includes('.') && a.split('.')[1].length >= 2) return a;
        return (a === '0' ? '' : a) + k;
      });
    }

    // live preview entry
    const previewEntry = useMemo(() => {
      const amt = parseFloat(amount) || 0;
      return { kind, amount: amt, year: yr, month: mo, installments, startYear: startY, startMonth: startM, frequency: freq };
    }, [kind, amount, yr, mo, installments, startY, startM, freq]);
    const split = useMemo(() => (kind === 'card' ? budgetHelpers.previewSplit(previewEntry) : []), [previewEntry, kind]);

    const valid = kind && parseFloat(amount) > 0 && category;

    function save() {
      const amt = parseFloat(amount);
      const base = { profile: state.currentProfile, kind, amount: amt, category, description: desc || category, year: yr, month: mo };
      if (kind === 'card') Object.assign(base, { installments, startYear: startY, startMonth: startM });
      if (kind === 'subscription') Object.assign(base, { frequency: freq });
      Budget.addEntry(base);
      toast(`${meta.label} added`);
      onClose();
    }

    // step 1: type chooser
    if (!kind) {
      return (
        <div className="m-add-flow">
          <div className="m-add-head">
            <button className="m-icobtn" onClick={onClose}><Icon name="close" size={20} /></button>
            <span>New entry</span>
            <span style={{ width: 36 }} />
          </div>
          <div className="m-add-body">
            <div className="m-type-q">What are you adding?</div>
            <div className="m-type-grid">
              {TYPE_CARDS.map((t) => {
                const m = KIND_META[t.kind];
                return (
                  <button key={t.kind} className="m-type-card" onClick={() => { setKind(t.kind); setPadOpen(true); }}>
                    <span className="m-type-ico" style={{ background: m.soft, color: m.color }}><Icon name={m.icon} size={22} color={m.color} /></span>
                    <span className="m-type-name">{m.label}</span>
                    <span className="m-type-sub">{t.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // step 2: form
    return (
      <div className="m-add-flow">
        <div className="m-add-head">
          <button className="m-icobtn" onClick={() => { setKind(null); setPadOpen(false); }}><Icon name="chevL" size={20} /></button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={meta.icon} size={17} color={meta.color} />{meta.label}
          </span>
          <button className="m-icobtn" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>

        <div className="m-add-body" style={{ paddingBottom: padOpen ? 8 : 110 }}>
          {/* amount display */}
          <button className={'m-amount' + (padOpen ? ' is-on' : '')} onClick={() => setPadOpen(true)}>
            <span className="m-amount-cur" style={{ color: meta.color }}>€</span>
            <span className="m-amount-val">{amount || '0'}</span>
          </button>

          {/* category */}
          <div className="m-field-lbl">Category</div>
          <div className="m-chips">
            {cats.map((c) => (
              <button key={c} className={'m-chip' + (category === c ? ' is-on' : '')}
                style={category === c ? { borderColor: catColor(c), background: catColor(c) + '14' } : {}}
                onClick={() => setCategory(c)}>
                <span className="m-chip-dot" style={{ background: catColor(c) }} />{c}
              </button>
            ))}
            {!addingCat && <button className="m-chip m-chip-add" onClick={() => setAddingCat(true)}><Icon name="plus" size={14} /> New</button>}
          </div>
          {addingCat && (
            <div className="m-newcat">
              <input autoFocus placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} onFocus={() => setPadOpen(false)} />
              <button onClick={() => { if (newCat.trim()) { Budget.addCategory({ name: newCat.trim(), type: isIncome ? 'income' : 'expense', active: true }); setCategory(newCat.trim()); } setAddingCat(false); setNewCat(''); }}>Add</button>
            </div>
          )}

          {/* description */}
          <div className="m-field-lbl">Description</div>
          <input className="m-input" placeholder="e.g. Madrac Vitapur" value={desc}
            onChange={(e) => setDesc(e.target.value)} onFocus={() => setPadOpen(false)} />

          {/* month */}
          <div className="m-field-row">
            <div className="m-field-lbl" style={{ margin: 0 }}>{kind === 'card' ? 'Purchase month' : kind === 'subscription' ? 'Starts' : 'Month'}</div>
            <MonthField year={yr} month={mo} onChange={(y, m) => { setYr(y); setMo(m || mo); }} />
          </div>

          {/* card specifics */}
          {kind === 'card' && (
            <div className="m-card-block">
              <div className="m-field-row">
                <div className="m-field-lbl" style={{ margin: 0 }}>Number of installments</div>
                <UI.Stepper value={installments} onChange={setInstallments} min={2} max={36} />
              </div>
              <div className="m-field-row">
                <div className="m-field-lbl" style={{ margin: 0 }}>First installment</div>
                <MonthField year={startY} month={startM} placeholder={`Auto · ${Budget.MONTHS[(mo % 12)]}`}
                  onChange={(y, m) => { setStartY(y); setStartM(m); }} />
              </div>
              {/* live preview */}
              <div className="m-prev">
                <div className="m-prev-h">
                  <span>Monthly split</span>
                  <Money value={(parseFloat(amount) || 0) / installments} cents className="m-prev-per" />
                </div>
                <div className="m-prev-track">
                  {split.slice(0, 12).map((s, i) => (
                    <div className="m-prev-cell" key={i}>
                      <span className="m-prev-mo">{Budget.MONTHS[s.month - 1]}{s.month === 1 ? " '" + String(s.year).slice(2) : ''}</span>
                      <span className="m-prev-amt"><Money value={s.amount} cents /></span>
                    </div>
                  ))}
                </div>
                {split.length > 0 && split[split.length - 1].year > year && (
                  <div className="m-prev-note">Rolls into {split[split.length - 1].year} automatically</div>
                )}
              </div>
            </div>
          )}

          {/* subscription specifics */}
          {kind === 'subscription' && (
            <div className="m-field-row">
              <div className="m-field-lbl" style={{ margin: 0 }}>Billing</div>
              <Segmented value={freq} onChange={setFreq}
                options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }, { value: 'once', label: 'Once' }]} />
            </div>
          )}
        </div>

        {/* footer save (hidden when pad open) */}
        {!padOpen && (
          <div className="m-add-foot">
            <button className="m-save" disabled={!valid} onClick={save}
              style={valid ? { background: meta.color } : {}}>
              Save {meta.label.toLowerCase()}{parseFloat(amount) > 0 ? ' · ' : ''}
              {parseFloat(amount) > 0 ? UI.money(parseFloat(amount), { auto: true }) : ''}
            </button>
          </div>
        )}

        {padOpen && <AmountPad onKey={key} onClose={() => setPadOpen(false)} />}
      </div>
    );
  }

  // ================= ROOT =================
  function MobileApp() {
    const state = UI.useStore();
    const [adding, setAdding] = useState(false);
    return (
      <div className="m-root">
        <Home state={state} year={state.year} month={state.month} onAdd={() => setAdding(true)} />
        {adding && <AddFlow state={state} year={state.year} month={state.month} onClose={() => setAdding(false)} />}
      </div>
    );
  }

  window.MobileApp = MobileApp;
})();

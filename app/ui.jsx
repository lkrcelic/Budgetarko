// ui.jsx — shared primitives + hooks. Exposes window.UI
(function () {
  const { useState, useEffect, useRef } = React;

  // live store hook
  function useStore() {
    const [, force] = useState(0);
    useEffect(() => Budget.subscribe(() => force((v) => v + 1)), []);
    return Budget.getState();
  }

  // money formatting
  const _eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const _eur0 = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  function money(n, opts = {}) {
    if (n == null || isNaN(n)) return '€0';
    const whole = Math.abs(n % 1) < 0.005;
    if (opts.cents) return _eur.format(n);
    if (opts.auto) return whole ? _eur0.format(n) : _eur.format(n);
    return _eur0.format(Math.round(n));
  }
  // signed, with + / − and color intent handled by caller
  function signed(n, opts) { const s = n < 0 ? '−' : '+'; return s + money(Math.abs(n), opts); }

  // ---- Money text ----
  function Money({ value, cents, auto, sign, className = '', style = {} }) {
    const txt = sign ? signed(value, { cents, auto }) : money(value, { cents, auto });
    return <span className={'mono-num ' + className} style={style}>{txt}</span>;
  }

  // ---- Avatar ----
  function Avatar({ profile, size = 32 }) {
    return (
      <div style={{ width: size, height: size, borderRadius: size, background: profile.tint, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
        fontSize: size * 0.42, letterSpacing: '.02em', flexShrink: 0 }}>{profile.initials}</div>
    );
  }

  // ---- Segmented control ----
  function Segmented({ options, value, onChange, full }) {
    return (
      <div className="seg" style={full ? { display: 'flex' } : {}}>
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return (
            <button key={val} className={'seg-btn' + (val === value ? ' is-on' : '')}
              style={full ? { flex: 1 } : {}} onClick={() => onChange(val)}>{label}</button>
          );
        })}
      </div>
    );
  }

  // ---- Stepper ----
  function Stepper({ value, onChange, min = 1, max = 60, suffix }) {
    const set = (v) => onChange(Math.max(min, Math.min(max, v)));
    return (
      <div className="stepper">
        <button onClick={() => set(value - 1)} aria-label="minus">–</button>
        <div className="stepper-val">{value}{suffix ? <span className="stepper-suf">{suffix}</span> : null}</div>
        <button onClick={() => set(value + 1)} aria-label="plus">+</button>
      </div>
    );
  }

  // ---- Month picker (popover) ----
  function MonthField({ year, month, onChange, allowYear = true, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
    }, []);
    const label = month ? Budget.MONTHS[month - 1] + (allowYear ? ' ' + year : '') : (placeholder || 'Select');
    return (
      <div className="mfield" ref={ref}>
        <button className={'mfield-btn' + (month ? '' : ' is-empty')} onClick={() => setOpen((o) => !o)}>
          {label}
          <svg width="11" height="7" viewBox="0 0 11 7"><path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {open && (
          <div className="mpop">
            {allowYear && (
              <div className="mpop-year">
                <button onClick={() => onChange(year - 1, month || Budget.NOW.month)}>‹</button>
                <span className="mono-num">{year}</span>
                <button onClick={() => onChange(year + 1, month || Budget.NOW.month)}>›</button>
              </div>
            )}
            <div className="mpop-grid">
              {Budget.MONTHS.map((m, i) => (
                <button key={m} className={'mpop-m' + (month === i + 1 ? ' is-on' : '')}
                  onClick={() => { onChange(year, i + 1); setOpen(false); }}>{m}</button>
              ))}
            </div>
            {placeholder && (
              <button className="mpop-clear" onClick={() => { onChange(year, null); setOpen(false); }}>Clear</button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- category color (stable hash to calm palette) ----
  const CAT_COLORS = {
    Salary: '#1f8a5b', 'Side job': '#3f7c6b', Gifts: '#8a7a3e', 'Other income': '#6b8a3e',
    Living: '#b5503e', Housing: '#5b7c9e', 'Loan payment': '#9e6b5b', 'Card installment': '#b08a3e',
    Car: '#6b6b8a', Travel: '#3f8a8a', Subscriptions: '#8a5b9e', Investing: '#4a7c5b',
  };
  const catColor = (name) => CAT_COLORS[name] || '#7c887f';

  // ---- tiny icon set (stroke, 1 path-ish, calm) ----
  function Icon({ name, size = 20, stroke = 1.7, color = 'currentColor' }) {
    const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const paths = {
      plus: <g {...p}><path d="M12 5v14M5 12h14"/></g>,
      expense: <g {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></g>,
      income: <g {...p}><path d="M12 19V5M5 12l7-7 7 7"/></g>,
      card: <g {...p}><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/></g>,
      sub: <g {...p}><path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4"/></g>,
      home: <g {...p}><path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/></g>,
      grid: <g {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></g>,
      calendar: <g {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></g>,
      layers: <g {...p}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/></g>,
      tag: <g {...p}><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="7.5" r="1.4"/></g>,
      user: <g {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></g>,
      download: <g {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></g>,
      check: <g {...p}><path d="M4 12l5 5L20 6"/></g>,
      chevR: <g {...p}><path d="M9 5l7 7-7 7"/></g>,
      chevL: <g {...p}><path d="M15 5l-7 7 7 7"/></g>,
      close: <g {...p}><path d="M6 6l12 12M18 6L6 18"/></g>,
      trash: <g {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></g>,
      edit: <g {...p}><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></g>,
      search: <g {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></g>,
      dot: <g {...p}><circle cx="12" cy="12" r="3" fill={color}/></g>,
      wallet: <g {...p}><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M16 12.5h3"/><path d="M3 9h13a2 2 0 0 1 2 2"/></g>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>{paths[name] || null}</svg>;
  }

  const KIND_META = {
    expense: { label: 'Expense', icon: 'expense', color: '#b5503e', soft: '#f7ece9' },
    income: { label: 'Income', icon: 'income', color: '#1f8a5b', soft: '#e9f3ee' },
    card: { label: 'Card installment', icon: 'card', color: '#b08a3e', soft: '#f5efe1' },
    subscription: { label: 'Subscription', icon: 'sub', color: '#8a5b9e', soft: '#f1ebf4' },
  };

  // ---- Toast host ----
  let toastFn = null;
  function ToastHost() {
    const [toasts, setToasts] = useState([]);
    useEffect(() => { toastFn = (msg) => { const id = Math.random(); setToasts((t) => [...t, { id, msg }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600); }; }, []);
    return (
      <div className="toast-host">
        {toasts.map((t) => (
          <div key={t.id} className="toast"><UI.Icon name="check" size={16} color="#1f8a5b" /><span>{t.msg}</span></div>
        ))}
      </div>
    );
  }
  const toast = (m) => toastFn && toastFn(m);

  window.UI = { useStore, money, signed, Money, Avatar, Segmented, Stepper, MonthField, Icon, catColor, KIND_META, ToastHost, toast };
})();

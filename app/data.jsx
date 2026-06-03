// data.jsx — Budgetarko store: model, installment logic, seed data
// Exposes window.Budget (store API), window.budgetHelpers
(function () {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const NOW = { year: 2026, month: 6 }; // June 2026 (per project date)

  // ---- expand an entry into absolute-month occurrences ----
  // returns [{ idx, amount }]   idx = year*12 + (month-1)
  function expand(e) {
    const A = e.year * 12 + (e.month - 1);
    const out = [];
    if (e.kind === 'card') {
      const n = Math.max(1, e.installments || 1);
      if (n === 1) { out.push([A, e.amount]); }
      else {
        let S;
        if (e.startMonth) S = e.startYear * 12 + (e.startMonth - 1);
        else S = A + 1; // default: next month after entry
        const per = e.amount / n;
        for (let i = 0; i < n; i++) out.push([S + i, per]);
      }
    } else if (e.kind === 'subscription') {
      const freq = e.frequency || 'monthly';
      if (freq === 'once') out.push([A, e.amount]);
      else if (freq === 'yearly') { for (let y = 0; y < 4; y++) out.push([A + y * 12, e.amount]); }
      else { const dur = e.durationMonths || 48; for (let i = 0; i < dur; i++) out.push([A + i, e.amount]); }
    } else if (e.recurring === 'monthly') {
      const dur = e.durationMonths || 48;
      for (let i = 0; i < dur; i++) out.push([A + i, e.amount]);
    } else if (e.recurring === 'yearly') {
      for (let y = 0; y < 4; y++) out.push([A + y * 12, e.amount]);
    } else {
      out.push([A, e.amount]);
    }
    return out.map(([idx, amount]) => ({ idx, amount }));
  }

  const isIncome = (e) => e.kind === 'income';

  // ---- preview of an entry's month split (for the add form) ----
  function previewSplit(e) {
    return expand(e).map((o) => ({
      year: Math.floor(o.idx / 12),
      month: (o.idx % 12) + 1,
      amount: o.amount,
    }));
  }

  // ---- aggregate a profile/year into matrix data ----
  function buildYear(entries, profileId, year) {
    const items = entries.filter((e) => e.profile === profileId);
    const base = year * 12;
    // income / expense category -> [12] month totals
    const incomeCats = {}, expenseCats = {};
    for (const e of items) {
      const bucket = isIncome(e) ? incomeCats : expenseCats;
      for (const o of expand(e)) {
        const m = o.idx - base;
        if (m < 0 || m > 11) continue;
        if (!bucket[e.category]) bucket[e.category] = new Array(12).fill(0);
        bucket[e.category][m] += o.amount;
      }
    }
    const sumRow = (catObj) => { const r = new Array(12).fill(0); for (const k in catObj) for (let m = 0; m < 12; m++) r[m] += catObj[k][m]; return r; };
    const incTotals = sumRow(incomeCats);
    const expTotals = sumRow(expenseCats);
    const net = incTotals.map((v, i) => v - expTotals[i]);
    let cum = 0; const cumulative = net.map((v) => (cum += v));
    return { incomeCats, expenseCats, incTotals, expTotals, net, cumulative,
      incYear: incTotals.reduce((a, b) => a + b, 0),
      expYear: expTotals.reduce((a, b) => a + b, 0) };
  }

  // ---- items active in a given month (for monthly view & home) ----
  function monthItems(entries, profileId, year, month) {
    const idx = year * 12 + (month - 1);
    const res = [];
    for (const e of entries.filter((x) => x.profile === profileId)) {
      for (const o of expand(e)) {
        if (o.idx === idx) {
          let inst = null;
          if (e.kind === 'card' && (e.installments || 1) > 1) {
            const S = e.startMonth ? e.startYear * 12 + (e.startMonth - 1) : e.year * 12 + e.month; // first installment idx
            const n = o.idx - S + 1;
            inst = { n, of: e.installments };
          }
          res.push({ entry: e, amount: o.amount, income: isIncome(e), inst });
        }
      }
    }
    return res;
  }

  // ---- active installment plans (card, >1) for tracker ----
  function activeInstallments(entries, profileId, refIdx) {
    return entries
      .filter((e) => e.profile === profileId && e.kind === 'card' && (e.installments || 1) > 1)
      .map((e) => {
        const S = e.startMonth ? e.startYear * 12 + (e.startMonth - 1) : e.year * 12 + e.month;
        const end = S + e.installments - 1;
        const per = e.amount / e.installments;
        const paid = Math.min(e.installments, Math.max(0, refIdx - S + 1));
        return { entry: e, start: S, end, per, paid, total: e.installments, done: refIdx > end, remaining: Math.max(0, e.amount - paid * per) };
      })
      .sort((a, b) => a.end - b.end);
  }

  // ================= SEED =================
  let _id = 1; const uid = () => 'e' + (_id++);
  const E = (o) => Object.assign({ id: uid(), year: 2026, month: 1 }, o);

  const seed = [
    // ----- LOVRO -----
    E({ profile: 'lovro', kind: 'income', category: 'Salary', description: 'Monthly salary', amount: 2150, recurring: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'income', category: 'Side job', description: 'Freelance web project', amount: 380, month: 3 }),
    E({ profile: 'lovro', kind: 'income', category: 'Side job', description: 'Logo design', amount: 420, month: 5 }),
    E({ profile: 'lovro', kind: 'income', category: 'Gifts', description: 'Birthday', amount: 150, month: 2 }),

    E({ profile: 'lovro', kind: 'expense', category: 'Housing', description: 'Rent', amount: 620, recurring: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'expense', category: 'Living', description: 'Groceries & daily', amount: 470, recurring: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'expense', category: 'Car', description: 'Fuel & insurance', amount: 140, recurring: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'expense', category: 'Loan payment', description: 'Consumer loan', amount: 230, recurring: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'expense', category: 'Investing', description: 'Index fund (DCA)', amount: 300, recurring: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'expense', category: 'Travel', description: 'Summer trip deposit', amount: 540, month: 5 }),
    E({ profile: 'lovro', kind: 'expense', category: 'Travel', description: 'Flights', amount: 310, month: 8 }),
    E({ profile: 'lovro', kind: 'expense', category: 'Gifts', description: 'Christmas gifts', amount: 180, month: 12 }),

    // subscriptions
    E({ profile: 'lovro', kind: 'subscription', category: 'Subscriptions', description: 'Netflix', amount: 13.99, frequency: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'subscription', category: 'Subscriptions', description: 'Spotify', amount: 10.99, frequency: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'subscription', category: 'Subscriptions', description: 'iCloud+', amount: 2.99, frequency: 'monthly', month: 1 }),
    E({ profile: 'lovro', kind: 'subscription', category: 'Subscriptions', description: 'Gym (annual)', amount: 240, frequency: 'yearly', month: 1 }),

    // the famous card installment — entered June 2026, 6 installments, default start = July
    E({ profile: 'lovro', kind: 'card', category: 'Card installment', description: 'Madrac Vitapur', amount: 330, installments: 6, month: 6 }),

    // ----- PATRICIJA -----
    E({ profile: 'patricija', kind: 'income', category: 'Salary', description: 'Monthly salary', amount: 1820, recurring: 'monthly', month: 1 }),
    E({ profile: 'patricija', kind: 'income', category: 'Side job', description: 'Tutoring', amount: 260, month: 4 }),
    E({ profile: 'patricija', kind: 'expense', category: 'Living', description: 'Groceries & daily', amount: 430, recurring: 'monthly', month: 1 }),
    E({ profile: 'patricija', kind: 'expense', category: 'Housing', description: 'Utilities share', amount: 180, recurring: 'monthly', month: 1 }),
    E({ profile: 'patricija', kind: 'expense', category: 'Car', description: 'Public transport & taxi', amount: 70, recurring: 'monthly', month: 1 }),
    E({ profile: 'patricija', kind: 'subscription', category: 'Subscriptions', description: 'Spotify', amount: 10.99, frequency: 'monthly', month: 1 }),
    E({ profile: 'patricija', kind: 'subscription', category: 'Subscriptions', description: 'YouTube Premium', amount: 11.99, frequency: 'monthly', month: 1 }),
    E({ profile: 'patricija', kind: 'card', category: 'Card installment', description: 'iPhone 16', amount: 960, installments: 12, month: 3 }),
    E({ profile: 'patricija', kind: 'expense', category: 'Gifts', description: 'Family gifts', amount: 140, month: 12 }),
  ];

  const seedCategories = [
    { name: 'Salary', type: 'income', active: true },
    { name: 'Side job', type: 'income', active: true },
    { name: 'Gifts', type: 'income', active: true },
    { name: 'Other income', type: 'income', active: false },
    { name: 'Living', type: 'expense', active: true },
    { name: 'Housing', type: 'expense', active: true },
    { name: 'Loan payment', type: 'expense', active: true },
    { name: 'Card installment', type: 'expense', active: true },
    { name: 'Car', type: 'expense', active: true },
    { name: 'Travel', type: 'expense', active: true },
    { name: 'Subscriptions', type: 'expense', active: true },
    { name: 'Investing', type: 'expense', active: true },
    { name: 'Gifts', type: 'expense', active: true },
  ];

  const profiles = [
    { id: 'lovro', name: 'Lovro', initials: 'L', tint: '#1f8a5b' },
    { id: 'patricija', name: 'Patricija', initials: 'P', tint: '#3f7c6b' },
  ];

  // ================= STORE =================
  const state = {
    entries: seed,
    categories: seedCategories,
    profiles,
    currentProfile: 'lovro',
    year: 2026,
    month: 6,
  };
  const listeners = new Set();
  const emit = () => { state._v = (state._v || 0) + 1; listeners.forEach((l) => l()); };

  const Budget = {
    MONTHS, MONTHS_LONG, NOW,
    getState: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    setProfile: (id) => { state.currentProfile = id; emit(); },
    setYear: (y) => { state.year = y; emit(); },
    setMonth: (m) => { state.month = m; emit(); },
    addEntry: (e) => { state.entries = [Object.assign({ id: uid() }, e), ...state.entries]; emit(); },
    updateEntry: (id, patch) => { state.entries = state.entries.map((x) => x.id === id ? Object.assign({}, x, patch) : x); emit(); },
    deleteEntry: (id) => { state.entries = state.entries.filter((x) => x.id !== id); emit(); },
    addCategory: (c) => { if (!state.categories.some((x) => x.name === c.name && x.type === c.type)) state.categories = [...state.categories, c]; emit(); },
    toggleCategory: (name, type) => { state.categories = state.categories.map((c) => c.name === name && c.type === type ? Object.assign({}, c, { active: !c.active }) : c); emit(); },
    // selectors
    buildYear: (year) => buildYear(state.entries, state.currentProfile, year),
    monthItems: (year, month) => monthItems(state.entries, state.currentProfile, year, month),
    activeInstallments: (year, month) => activeInstallments(state.entries, state.currentProfile, year * 12 + (month - 1)),
    catsFor: (type) => state.categories.filter((c) => c.type === type && c.active).map((c) => c.name).filter((v, i, a) => a.indexOf(v) === i),
  };

  window.Budget = Budget;
  window.budgetHelpers = { expand, previewSplit, buildYear, monthItems, activeInstallments, isIncome };
})();

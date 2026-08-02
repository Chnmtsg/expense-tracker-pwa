// Stage 0 fixture — see expense-pwa/VERIFICATION.md
function loadFixture() {
  var cid = db.categories[0].id;
  db.planned = [
    { id: 'F1', date: '2026-03-15', amount: 100000, categoryId: cid, notes: 'one-off' },
    { id: 'F2', date: '2026-01-31', amount: 200000, categoryId: cid, notes: 'monthly 31st', recFrequency: 'monthly' },
    { id: 'F3', date: '2025-10-05', amount: 50000,  categoryId: cid, notes: 'monthly past', recFrequency: 'monthly' },
    { id: 'F4', date: '2026-02-02', amount: 10000,  categoryId: cid, notes: 'weekly ends',  recFrequency: 'weekly', recEndDate: '2026-03-02' },
    { id: 'F5', date: '2026-06-01', amount: 1000,   categoryId: cid, notes: 'daily ends',   recFrequency: 'daily',  recEndDate: '2026-06-10' }
  ];
  db.actual = [];
  db.income = [];
  return cid;
}

var RANGES = [
  { key: 'A', from: '2026-02-01', to: '2026-02-28', expectTotal: 290000, expectPlans: 3 },
  { key: 'B', from: '2026-03-01', to: '2026-03-31', expectTotal: 360000, expectPlans: 4 },
  { key: 'C', from: '2026-06-01', to: '2026-06-30', expectTotal: 260000, expectPlans: 3 },
  { key: 'D', from: '2025-10-01', to: '2025-10-31', expectTotal: 50000,  expectPlans: 1 }
];

function sumOccurrences(from, to) {
  return expandPlannedInRange(db.planned, from, to)
    .reduce(function (s, x) { return s + (+x.amount || 0); }, 0);
}
function plansListed(from, to) {
  return db.planned.filter(function (p) { return hasPlannedOccurrence(p, from, to); }).length;
}

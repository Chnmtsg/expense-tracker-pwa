# Design request — clearing the bell

**For the Chief Architect.** From the owner, using the application:

> *"Now work on the notification, add the delete button in there, there are lot of overdue notifications in there"*

**Two requests in one sentence, and they may not have the same answer.** One is a shape — a delete button. One is a symptom — the list fills with overdue rows and stays full. **The symptom has a structural cause I can name at source, and the shape has a problem I cannot solve without you.**

**This is the first request in this programme that is not about the Debts module.** `computeReminders` and the notification sheet are shared by Planned, Goals and Debts, and three of the four branches contribute to what the owner is seeing. Scope is §5.

---

## 1. The problem with "delete", stated first because it is structural

**There is nothing to delete.** `computeReminders()` derives the whole list from `db.planned`, `db.goals` and `db.debts` on every call, and `openNotifModal` calls it fresh each time it opens. **No notification is stored anywhere.** A delete button would have no record to act on, so "delete" has to be given a meaning before it can be built, and every meaning I can find costs something:

| Reading | What it costs |
|---|---|
| **(a) Dismiss this one** | A stored dismissal — a new key or field, and one that must be re-armed when the underlying date moves or the item silently never returns. **And for a debt it hides a real obligation**, on a screen whose mission sentence is that the number should be *known rather than feared*. |
| **(b) Delete the underlying record** | A debt deleted from a notification sheet takes its whole payment ledger with it. Deletion on the Debts screen is confirmed with a dialog naming the cascade and the payment count; a ✕ in a list of rows is the opposite of that. |
| **(c) Stop reminding about this one** | A per-record mute. Storage again — and for a debt it is `settledOn` wearing a different hat, which already exists and already works from the card. |
| **(d) Age it out after N days** | No storage, and no button either. **It also hides an obligation without the user choosing to**, which I think is worse than any of the above, not better. |

**I am not proposing any of these yet, because §2 may mean the owner does not need one.**

---

## 2. Why the list fills up, verified at source

**Three of the four branches have no lower bound. Two of the four do. Nobody decided this — it accumulated.**

| Branch | Floor | Can an item sit there for ever? |
|---|---|---|
| **Planned, recurring** | `nextPlannedDue` walks with `floor = todayISO()` | **No.** It always reports the next future occurrence. |
| **Planned, one-off** | `return (p.recLastDone \|\| '') >= p.date ? null : p.date` — **no floor** | **Yes.** A one-off planned expense dated in the past reminds for ever until it is logged. |
| **Goal deadlines** | `if (g.deadline > cutoff) return` — upper bound only | **Yes.** A missed deadline on an unreached goal reminds for ever. |
| **Goal auto-contributions** | `computeNextRecurring` | **No.** |
| **Debts** | `if (date > cutoff) return` — upper bound only, and the comment says the absence is deliberate | **Yes.** Until the debt is paid off or marked settled. |

**So the owner's "a lot of overdue notifications" is three permanent-row generators in one list, and the list is sorted by date, so the oldest — the most stuck — sit at the top.** Every one of them is a true statement. None of them can be cleared except by acting on the record.

**And two of the three already have a clearing act that the sheet does not offer.** A one-off planned expense clears when `recLastDone` is set — a field that exists, that `nextPlannedDue` already reads, and that no new storage is needed to write. A debt clears when it is settled — `settledOn`, which exists and is reachable from the card's ✓ but **not from the bell**. **A goal deadline has no clearing act at all short of editing the goal.**

---

## 3. What I think this is, and I hold it loosely

**The owner asked for a delete button because the sheet gives them no way to say "this one is dealt with" — and for two of the three sources, the application already has the fact that would say it.**

**Shape A — a second action per row, type by type, storing nothing new.** The action column already renders per type and already carries two buttons for two of them. For an **overdue** row it could carry the clearing act that type already has: *Skip this one* for a one-off planned expense (writes `recLastDone`, the existing field, exactly as logging it would); *Mark settled* for a debt (opens the settle sheet the card's ✓ already opens). **Goals would get nothing**, which is honest rather than tidy.

**Shape B — one dismiss button with stored dismissals.** The thing the owner literally asked for. It works uniformly across all four types and it costs a new stored object, a re-arming rule, and — the part I cannot get past — **a debt reminder the user can make disappear while the debt is still owed.**

**Shape C — a floor.** Overdue items age out after some number of days. No button, no storage, uniform. **And it makes the application stop mentioning a debt that is still owed, without being asked to**, which I think is the worst of the three even though it is the smallest.

**Shape D — neither, and the list is correct as it stands.** Every row is true, every row has an action, and a full bell on a screen about debt may be the honest state of that user's finances. **Available, and I would rather you took it than took B.**

---

## 4. Six things I cannot settle

**(a) Is "delete" the owner's word for dismiss, or for "stop bothering me about this kind of thing"?** The settings screen already has four per-type toggles. If the complaint is category-level, that control exists and the answer is discoverability, not a new button.

**(b) Does an overdue row need a different treatment from a future one at all?** Today they differ only in a label — *Overdue 18d* against *In 3d*. Every shape above treats overdue as a distinct state for the first time.

**(c) If a clearing act ships, does it confirm?** Deleting on the Debts screen confirms and names the cascade. *Skip this one* writes a field and changes what the Dashboard reports; I do not think that is a silent act, and I do not know where the line is.

**(d) Does anything in the sheet get to write to `db`?** The existing actions either hand off to a modal or, in one case — the goal auto-contribution — **write and save directly from the sheet.** So there is precedent, and it is exactly one precedent.

**(e) What does this do to the bell badge?** ~~`updateBellBadge` counts `urgency === 'urgent'`~~ — **this clause was wrong and is corrected here rather than quietly: `updateBellBadge` counts `reminders.length`, every reminder of every type.** The reader that filters on `urgency === 'urgent'` is `maybeFireOSNotifications`, and this request conflated the two. The point survives the correction and is if anything stronger: a permanent overdue row is a permanent +1 on the badge whatever its urgency, so a user with three stuck debts has a badge that never falls below three. **That may be the real complaint rather than the list.** *(Caught by the fixture for `CLB-01`, which was written to the wrong expectation and failed against correct code.)*

**(f) Scope.** Three modules share this surface. A change to the planned branch reaches the Planned screen's semantics; a change to the debt branch touches a module with twelve rulings on it. **I would rather ship one type's action than one uniform mechanism**, but that is a preference and the uniformity argument is real.

---

## 5. What I am asking for

1. **Rule §1** — what "delete" may mean here, if anything.
2. **Rule §3** — A, B, C, D, or something else. **D is a real answer.**
3. **Rule §2** — whether the three unfloored branches are a defect to be fixed, a design to be documented, or a mix.
4. **Rule §4(e)** — the permanent badge, which may be the complaint under the complaint.
5. **Rule §4(a)** — whether this is a discoverability problem with the settings that already exist.
6. **Rule §4(f)**, the scope: one type, or all four.

## 6. What I am not asking for

Not the deletion of any record from the bell. Not a dismissal that hides a debt that is still owed. Not a new notification store, a per-item state machine, or a read/unread model. Not a change to `computeReminders`' four gates, the four settings, `maybeFireOSNotifications`, or the OS-notification path. Not a change to any figure, derivation or write path in the Debts module. Not a new storage key, schema field, `SCHEMA_VERSION` bump or migration unless §3 rules one in explicitly. Not a new harness runner, probe or predicate. Not a Mongolian string.

---

## 7. One thing on the record

**The bell was built one branch at a time and nobody has ever looked at it whole.** Two branches floor their dates and two do not; two have a clearing act the sheet does not offer and one has none; the badge counts a state that, for three of the four, never ends. **None of that is a bug and all of it is why the owner is looking at a full list.**

**This is the same shape as the calculator that said nothing** — every part correct, the seam between them not designed by anyone. That one was found by the owner using the application too.

---

## 8. Addendum — the owner answered §4(a) and §4(e) before this was ruled

Both were put to them the moment this request was written.

**§4(a) — what "delete" means.** Offered three readings — mark it dealt with, hide the row while the record stands, or stop the whole category — they chose: **"Mark it dealt with."**

**That is Shape A, in their own words, and it removes the shape I could not get past.** They are not asking for a stored dismissal. They are asking the sheet to let them record the fact that already clears the row — and for two of the three permanent sources the application **already holds that fact and already has the field**: `recLastDone` for a one-off planned expense, `settledOn` for a debt. **Shape B is dead by the owner's own answer, and with it the debt reminder a user could make disappear while the debt was still owed. Shape C is dead too — they want to act, not to have the row time out behind them.**

**What it does not settle.** Goal deadlines still have no clearing act, so under Shape A they keep their permanent row and the answer to the third source is *nothing*. That has to be ruled and said out loud rather than left as the gap that falls out of the other two being fixed.

**§4(e) — the badge or the list.** Offered the badge, the list, or both equally, they chose: **"The long list when I open it."**

**So the permanent-urgent badge is not the complaint** and I am not proposing to touch `updateBellBadge`. It stays on the record as the thing I expected to be the answer and was not — the badge does count a state that never ends for three of the four branches, and the owner does not mind. **Any shape that fixes the list will reduce the badge as a side effect, and none should be justified by that.**

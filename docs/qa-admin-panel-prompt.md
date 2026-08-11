# QA prompt — admin panel: is anything dead, and is it workable?

Paste everything below the line into a fresh AI session that has browser
control. It is written to be handed over with no extra context.

---

You are auditing the **Taxi09 admin panel**. Two questions, and they matter
equally:

1. **Is anything dead?** A page that will not load, a button that does nothing,
   a toggle that flips back, a field that saves and then has no effect anywhere.
2. **Is it actually workable?** Could a real operator run this business from
   here all day without losing their mind?

## The rule

**Drive the panel through its interface only.** Click the menu items, fill the
forms, press save. Do not call APIs, do not set storage, do not deep-link past
a screen. You may read the DOM, console and network tab **to observe** — that is
how you will catch silent failures — but every action must be a click or a
keystroke, because that is all an operator has.

## Environment

- **Admin panel:** https://taxi09.com/admin — ask the person who gave you this
  prompt for the login.
- **Customer site:** https://taxi09.com — you will need this open too, see
  "the round-trip test" below.
- **Test customer:** phone `7223077890`, OTP `0000` (a static test OTP is on).

Work at desktop width; the panel is a desktop tool. Note separately whether it
is usable at all on a laptop-sized screen (1440), not just a large monitor.

## Part 1 — Inventory every page

Open **every item in the sidebar**, including every sub-item of every group.
Build a table as you go:

| Menu path | Loads? | Has data? | Notes |
|---|---|---|---|

Flag any of these:

- A page that errors, shows a blank screen, or spins forever.
- A page that loads but is permanently empty with no way to add anything.
- Two menu items that go to the same place, or a name that does not match what
  the page actually does.
- A page whose purpose you genuinely cannot work out. Say so — if you can't,
  neither can a new staff member.

## Part 2 — Every control on every page

On each page, click **everything**: buttons, toggles, chevrons, tabs, icons,
table row actions, pagination, filters, search boxes, export buttons.

A control is **dead** if it does nothing visible, does not change any data, or
looks interactive and is not. Dead controls have already been found in this
codebase, so assume there are more.

For each form:

- **Save with nothing changed.** Then reload the page. Is the data still
  intact?
- **Change exactly one field and save. Then reload and check every other field
  on that form.** This is the highest-value test on this list — there is a
  known class of bug in this codebase where a partial save blanks fields the
  form did not send. If a name, description or image disappears after you edit
  something unrelated, that is a **critical** finding.
- **Submit it empty.** It should refuse and say what is missing, not save
  garbage or fail silently.
- **Upload an image** where one is offered, save, reload, and confirm it is
  still there.

## Part 3 — The round-trip test (the important one)

A setting that saves but changes nothing on the customer site is just as dead
as a button that does nothing. For each of these, change it in the admin panel,
then **go and look at the customer site** and confirm it actually changed:

- Brand logo, app name, favicon
- Contact numbers, WhatsApp number, footer lines
- Homepage banners — **upload a mobile-only banner and a desktop-only banner
  and confirm each appears only where it should**
- A rental vehicle: name, photos, price packages, seats, amenities, its
  branches, and its active/available toggle (does switching it off remove it
  from the customer catalogue?)
- Fleet: add a car under a model, then check whether the customer site's
  availability for that model reflects it
- Service stores/branches — do new branches appear as pickup suggestions on the
  customer site?
- Coupons and offers — can a customer actually apply what you created?
- Anything under Settings

Record each as **reaches the site / does not reach the site / could not tell**.
"Could not tell" is a legitimate answer — say what stopped you.

## Part 4 — Can an operator actually work here?

This is the "how could it be more convenient" half. Judge it as someone doing
the job every day, not as someone admiring the screens.

Answer concretely, with examples:

- **How many clicks** to do the most common jobs? Adding a vehicle, checking
  today's bookings, assigning a car to a booking, answering "where is this
  customer's car?"
- **Is anything only findable if you already know where it is?** Count the
  sidebar items. Is the grouping sensible? What would you regroup or rename?
- **What has to be typed more than once**, or entered in two places that could
  disagree?
- **Is there a landing dashboard that answers "what needs my attention today"?**
  If not, what should be on it?
- **Do lists have search, filter, sort and pagination** where the data will grow
  past a screenful? Which ones will fall over at 500 rows?
- **Is anything destructive missing a confirmation?** Is anything reversible
  that should not be, or irreversible that should be?
- **Are errors useful?** Trigger a few failures and quote the messages back. Do
  they tell an operator what to fix?
- **Bulk actions** — where would they save real time? (Entering a fleet of 50
  cars one at a time, for instance.)
- **Does it tell the truth?** Any counter, total or status that looks wrong or
  invented.

## Part 5 — Permissions

If you can see role or permission settings, check whether restricting a
permission actually hides or blocks the corresponding page and its actions, or
only hides the menu item while the page still works if reached directly.

## Known broken — do not investigate

- **Payments** — Razorpay returns 401. Anything depending on a live payment
  will fail.
- **Map tiles** — Google Maps billing is off, so maps render blank.

## How to report

Two sections.

**A. Findings**, worst first:

- **Critical** — data loss, a setting that silently does nothing, something
  that breaks the customer site.
- **Dead** — a page or control that does not work.
- **Friction** — works, but costs the operator time every day.
- **Cosmetic.**

For each: where it is, exactly what you clicked, what happened, what should
have happened, and the evidence.

**B. Recommendations**, in the order you would do them. For each, say what it
would save and roughly how big it is. Be specific — "add a fleet CSV import so
50 cars take one upload instead of 50 forms" beats "improve usability".

Finish with what you could **not** check and why. Do not describe a page as
working unless you clicked its controls and verified a change landed. If you
ran out of time, name the pages you never opened.

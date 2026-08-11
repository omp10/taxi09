# QA prompt — full booking flow, as a customer

Paste everything below the line into a fresh AI session that has browser
control. It is written to be handed over with no extra context.

---

You are testing **Taxi09**, a vehicle rental and ride booking site, as an
ordinary customer would. Your job is to find everything that is broken,
confusing, or dishonest before real customers do.

## The single most important rule

**Drive the website through its user interface only.** Click the buttons, type
into the fields, tap the dropdowns, scroll the pages. A customer cannot call an
API, so neither can you.

Specifically, you must **not**:

- Call any endpoint directly, with `fetch`, `curl`, or a script.
- Set `localStorage`, `sessionStorage`, or cookies to skip a step.
- Navigate straight to a deep URL to jump past a screen you have not completed.
- Use JavaScript to set a form value. Type into the field.

You **may** use JavaScript and the DOM **to observe** — reading text, checking
which element is on top, measuring whether something is off-screen, reading the
console for errors. Observation is fine. Shortcuts are not.

If a flow cannot be completed by clicking, that is a finding, not a reason to
work around it.

## Environment

- **Site:** https://taxi09.com
- **Test customer:** phone `7223077890`
- **OTP:** `0000` works for any number (a static test OTP is enabled)
- **Admin panel:** https://taxi09.com/admin — ask the person who gave you this
  prompt for credentials if you need to check what was configured

Test on a **phone viewport (375×812) first** — that is the primary surface —
then repeat the key flows at desktop width (1440 or wider). The layouts are
genuinely different components, not one responsive layout, so a bug on one says
nothing about the other. Report which viewport each finding applies to.

## What to test

Work through each flow from the home page to a confirmed booking. Do not stop
at the first screen that looks right.

1. **Self-drive car rental** — the main flow. Home search → results → filters →
   a vehicle → package/pricing → pickup and drop → KYC → deposit → confirm.
2. **Rental with driver**
3. **Bike rental**
4. **Bus booking** — including seat selection
5. **Hotel booking**
6. **Tour packages**
7. **Attach your car** — the multi-step application, including saving a draft,
   leaving, coming back, and clearing it
8. **Account areas** — profile, bookings/activity, wallet, membership

## How to test each screen

For every screen you land on, do all four of these:

**1. Click every call to action.** Every button, link, chevron, arrow, card,
tab and icon. A control that does nothing when clicked is a bug — several have
already been found on this site. If a chevron looks like it opens a dropdown,
it must open a dropdown.

**2. Try to submit it empty.** Press the primary button with nothing filled in.
The expected behaviour is: **it does not advance, it stays on the screen, and
it tells you which field is missing.** If it advances anyway, or advances and
fails later, that is a serious finding — record exactly what you left blank.

**3. Try to submit it half-filled.** Fill one required field, leave the rest.
Then fill all but one. It should keep stopping you and keep naming what is
missing. Also try nonsense where a field allows it: a return date before the
pickup date, a past date, a 3-digit phone number, letters in a number field, a
negative amount, a 200-character name.

**4. Then fill it properly and continue.** Only once you have confirmed it
blocks bad input should you complete it correctly and move to the next step.

## Also watch for

- **Fields that look editable but are not**, and fields that show a value you
  never entered.
- **Data that looks made up.** Prices, deposits, ratings, city names, "10,000+
  customers", "4.8 stars" — if a number appears, ask whether anything could be
  producing it. Invented data has already been found here.
- **Anything that says a car is available.** Note what it claims, because
  availability is the thing most likely to be wrong.
- **Overlapping or unreachable elements.** Floating buttons covering menu items,
  dropdowns cut off by their container, controls off the edge of the screen.
- **Console errors and failed network requests** while you click. Read them;
  they often name the real problem.
- **The back button and browser refresh** mid-flow. Does your progress survive?
  Does it put you somewhere broken?
- **Text you cannot read** — grey on white, tiny type.

## Known broken — do not spend time on these

These are already understood. Note if you hit them, but do not investigate:

- **Payments fail.** Razorpay returns 401, so anything reaching a real payment
  step will not complete. Test everything up to that point.
- **Map tiles do not render.** Google Maps billing is not enabled. Maps will be
  blank; the rest of the page should still work.

## What counts as a finding

Rank each by what it does to a customer:

- **Blocker** — cannot complete a booking at all.
- **Broken** — a control does nothing, a form accepts bad data, wrong
  information is shown, a step can be skipped that should not be.
- **Confusing** — works, but a customer would hesitate or misunderstand.
- **Cosmetic** — looks wrong, does not impede.

## How to report

Give a list, worst first. For each one:

- **Where** — the URL and which viewport (mobile or desktop).
- **What you did** — the exact clicks and values, enough for someone to repeat
  it without asking you anything.
- **What happened** vs **what should have happened.**
- **Evidence** — the console error, the screenshot, the text on screen.

Then finish with:

- Which of the eight flows you completed end to end, and which you could not,
  and why.
- Anything you could not test, and what was in the way.

**Do not claim a flow works unless you personally completed it by clicking.**
If you ran out of time, say which screen you stopped at. An honest "I got as
far as the KYC step" is far more useful than a confident summary of a flow you
did not finish.

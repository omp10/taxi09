# Making rental search and availability real

_A guide to turning the current rental flow into a Zoomcar-style booking system._
_Written against commit `719d5e8`._

---

## The one thing that matters most

**The system has no concept of an individual car.**

`TaxiRentalVehicleType` is a *model line* — "Maruti Baleno 2024-25" — not a car.
There is no registration number, no per-car record, no fleet count. The only
per-unit vehicle records in the codebase are `AttachedVehicle` (cars owners
submit for listing) and the bus models; neither is wired into rental inventory.

Three consequences, all of which the user can see today:

1. **One booking blocks the entire model.** `rentalAvailabilityService` keys
   clashes on `vehicleTypeId`, so if someone books a Baleno for Saturday, every
   Baleno you own shows as unavailable that day. Owning five makes no
   difference.
2. **Staff cannot assign a specific car.** `RentalBookingRequest.assignedVehicle.vehicleId`
   references `TaxiRentalVehicleType`, so "assigning a vehicle" assigns a model
   line. There is nothing to mark as taken.
3. **You cannot express that a car is off the road.** Servicing, damage, or a
   car being at the wrong branch has nowhere to live.

Everything else in this guide is smaller than this. Fix this first or the rest
is decoration.

---

## What already works

Worth knowing before rewriting anything — more exists than it appears:

| Capability | Where | State |
|---|---|---|
| Location filtering | `listPublicRentalVehicleCatalog` | Works. Matches `ServiceStore` by name/address regex, then filters vehicles by `serviceStoreIds`. A location with no branch correctly matches nothing. |
| Date-overlap availability | `rentalAvailabilityService.getRentalAvailability` | Correct interval logic (`start < otherEnd && end > otherStart`), touching windows don't clash, finished/cancelled statuses release the vehicle. |
| Availability surfaced to the UI | `available`, `availableFrom` on each catalogue item | Already returned. `DesktopCarList` already renders the "Free from …" state. |
| Admin controls the catalogue | `/admin/pricing/rental-vehicles` | Name, images, category, seats, bags, amenities, pricing packages, subscription plans, add-ons, branches (`serviceStoreIds`), active toggle. |

The availability *algorithm* is sound. It is applied at the wrong granularity.

---

## Bug 1 — Mobile search throws the search away

**Symptom:** the thing you noticed. On a phone you can search from the home
card and get results that ignore what you typed.

**Cause:** the mobile results list calls the catalogue with no query at all.

```js
// BikeRentalHome.jsx:364
const response = await userService.getRentalVehicles();   // no params

// userService.js:43
getRentalVehicles: async () => api.get('/users/rental-vehicles'),   // no params
```

Desktop does it properly (`DesktopCarList.jsx:143-147`). Mobile does not.

**Also a naming mismatch across the chain** — three different vocabularies for
the same values:

| Layer | Parameter names |
|---|---|
| Search card writes (`MobileHomeSearch.jsx`) | `location`, `date`, `time`, `returnDate`, `returnTime` |
| Desktop list reads (`DesktopCarList.jsx`) | `location`, `pickupISO`, `returnISO` |
| API accepts (`adminController.js:669`) | `location`, `pickup` \| `pickupDateTime`, `return` \| `returnDateTime` |

So even the date fields the mobile card collects could not reach the API
unchanged.

### Fix

Settle on one URL contract and use it everywhere. Suggested:

```
/taxi/user/rental?search=true
  &location=<branch or city text>
  &pickup=<ISO 8601>
  &return=<ISO 8601>
```

1. Make `getRentalVehicles` accept params:
   ```js
   getRentalVehicles: async (params = {}) =>
     api.get(`/users/rental-vehicles${new URLSearchParams(params).toString() ? `?${new URLSearchParams(params)}` : ''}`),
   ```
2. Have the search card emit `pickup`/`return` as ISO by combining its date and
   time fields, instead of four separate params.
3. Have `BikeRentalHome` read `useSearchParams()` and pass them through, exactly
   as `DesktopCarList` does.
4. Delete the `pickupISO`/`returnISO` naming from `DesktopCarList` in favour of
   the shared names.

**Effort:** an afternoon. No schema change. Do this first — it is the visible
half of the complaint and is independent of everything below.

---

## Bug 2 — ~~Bookings can be made without dates~~ (withdrawn)

**This was wrong.** On re-reading `createRentalBookingRequest`
(`userController.js:4119-4131`) the booking path already rejects a missing
pickup, a missing return, and a return that is not after the pickup, each with
a 400.

It also re-checks availability server-side at submit
(`userController.js:4149`), with the comment noting the car may have been taken
since the list was rendered — so double-booking is guarded too, and the client
is not trusted.

The "everything is available" default in `getRentalAvailability` applies only
when no window is supplied, which is the correct behaviour for *browsing* the
catalogue. Nothing to do here.

## Bug 3 — Deposit and pricing are partly fictional

Now fixed for the deposit, but the pattern is worth naming because it recurs:
the vehicle detail page hardcoded **"₹2000 Refundable"** while no vehicle record
carried a deposit at all. Hourly packages still have no deposit field — only
subscription plans do (`subscription.plans[].deposit`).

**Decide:** should a self-drive rental take a deposit? If yes, `deposit` belongs
on the pricing package (and probably on the vehicle as a default), configurable
in `/admin/pricing/rental-vehicles`. Until then most vehicles honestly show
"Not required".

---

## The main work — per-unit inventory

### New model: `RentalVehicleUnit`

One document per actual car. This is the piece that does not exist.

```js
{
  vehicleTypeId:   ObjectId,   // -> TaxiRentalVehicleType ("Baleno 2024-25")
  registrationNumber: String,  // "MP09 AB 1234" - unique, the human identifier
  serviceStoreId:  ObjectId,   // which branch it lives at
  status:          String,     // 'available' | 'maintenance' | 'retired'
  odometerKm:      Number,
  colour:          String,
  notes:           String,
  activeFrom:      Date,       // when it entered the fleet
}
```

Index `{ vehicleTypeId: 1, serviceStoreId: 1, status: 1 }`.

Keep the *type* for everything customer-facing — photos, description, pricing,
amenities. A customer books "a Baleno from Vijay Nagar", not a registration
number, exactly as Zoomcar works. The unit is what the *operator* manages and
what availability counts.

### Rework availability to count units

Replace the boolean with a count. Pseudocode for the new
`getRentalAvailability`:

```
for each requested vehicleType:
    totalUnits = count(units where type, branch matches, status = 'available')
    bookedUnits = count(bookings overlapping the window
                        for this type, at this branch,
                        status not in RELEASED_STATUSES)
    blockedUnits = count(unit blocks overlapping the window)   // servicing etc.

    free = totalUnits - bookedUnits - blockedUnits
    available   = free > 0
    unitsLeft   = max(free, 0)
    availableFrom = earliest return among overlapping bookings, when free == 0
```

This gives you three things at once: correct availability with a real fleet,
"only 2 left at this price" scarcity messaging, and a basis for overbooking
rules later if you want them.

### Assignment becomes real

Change `RentalBookingRequest.assignedVehicle.vehicleId` to reference
`RentalVehicleUnit` instead of `TaxiRentalVehicleType`. Then:

- Staff assign a specific registration number to a booking.
- That unit is unavailable for overlapping windows, automatically — it falls out
  of the count above, no separate flag needed.
- Handover has something to attach the odometer photos to (see below).

**Migration:** for every existing `RentalVehicleType`, create N units where N is
however many of that model you actually own. There is no fleet count in the
data today, so this number has to come from you — it cannot be derived. A
one-off admin screen ("how many of each do you have, and at which branch?") is
probably the least painful way in.

### Unit blocks (servicing, damage, transfers)

A small collateral model, or a subdocument array on the unit:

```js
{ unitId, from: Date, to: Date, reason: 'service' | 'damage' | 'transfer', notes }
```

Counted as `blockedUnits` above. This is what lets an operator say "MP09 AB 1234
is in the workshop next week" without deleting it from the fleet.

---

## Admin panel additions

Everything above needs somewhere to be managed. In rough priority:

1. **Fleet page** — `/admin/fleet` (or under Pricing). List units with
   registration, model, branch, status, and current/next booking. Add, edit,
   retire. This is the single most valuable new screen.
2. **Assignment on the booking** — on the rental booking detail, a dropdown of
   units that are free for that booking's window, at that booking's branch.
   Assigning writes `assignedVehicle.unitId`.
3. **Availability calendar** — per unit, a month view of bookings and blocks.
   Not essential for launch; very useful by the time you have 20+ cars.
4. **Deposit on pricing packages** — see Bug 3.
5. **Fleet count visible on the vehicle type** — a derived "8 units, 3 available
   today" line on `/admin/pricing/rental-vehicles`, so the catalogue page
   reflects reality.

---

## Search quality, once the plumbing is right

The current location match is `regex` against `ServiceStore.name` and
`.address`. That is a reasonable start and genuinely works, but:

- **"Indore" matches every Indore branch** — correct, and what you want.
- **A typo matches nothing.** Consider a `serviceStoreId` param from the
  suggestion list, falling back to text only when the user typed something free-form.
  The suggestion dropdowns already exist on both home and rental pages; they
  currently pass text.
- **`LOCATION_SUGGESTIONS` in `BikeRentalHome.jsx` is a hardcoded array** of
  Indore place names. It should come from `/users/service-stores` like the
  desktop and mobile home cards already do. Right now, adding a branch in the
  admin panel does not make it suggestable on that page.

Filters that should move server-side once the list grows beyond a few dozen
cars — they are currently applied in the browser after fetching everything
(`BikeRentalHome.jsx:564-569`): price band, transmission, fuel, seats.

---

## Suggested order

| # | Work | Why this order | Rough size |
|---|---|---|---|
| 1 | Unify the search URL contract; make mobile send its params | Visible fix, no schema change, unblocks testing everything else | Half a day |
| 2 | Suggestions from `/users/service-stores` everywhere | Removes the hardcoded city list; admin becomes the source of truth | Half a day |
| ~~3~~ | ~~Reject dateless bookings~~ | Already implemented - see Bug 2 | Done |
| 4 | `RentalVehicleUnit` model + migration screen | The foundation | 2-3 days |
| 5 | Count-based availability | Makes a real fleet behave correctly | 1-2 days |
| 6 | Admin fleet page | Operators can manage the above | 2-3 days |
| 7 | Assignment writes a unit; unit blocks | Staff assignment becomes meaningful | 1-2 days |
| 8 | Server-side filters, deposit on packages, unit calendar | Polish | As needed |

Items 1-2 are worth doing this week regardless of whether you commit to the
larger inventory work. They are independent and each fixes something a customer
can hit today.

---

## Things this guide deliberately does not claim

- **I have not measured booking volume.** Whether type-level availability is
  hurting you right now depends on how many duplicate models you own. If you
  have exactly one of each car, the current design is not yet wrong — it just
  cannot grow.
- **Payment and deposit capture are out of scope here.** Razorpay currently
  returns 401, which blocks testing any of the checkout paths end to end.
- **Odometer capture at handover** already exists on the ride flow and gates the
  start PIN. It has no equivalent on rentals. Once units exist, the same pattern
  should attach to a rental handover — that is the natural place for it, and the
  component (`shared/components/OdometerCapture.jsx`) is already generic.

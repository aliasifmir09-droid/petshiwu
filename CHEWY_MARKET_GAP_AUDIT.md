# Chewy Market Gap Audit — Petshiwu

**Date:** August 19, 2026  
**Method:** Live Chewy.com + Chewy FY2025 / Q1 FY2026 public filings, plus live Petshiwu catalog API (`petshiwu.com/api`).  
**Live catalog snapshot:** 8,775 SKUs, 353 brands, 169 categories.

This is a market audit, not a “copy Chewy” list. Chewy is a $12.6B national e-tailer. We do not win by matching their pharmacy, clinics, or Autoship machine. We win by being the NYC same-day store they cannot be — and by closing the catalog and trust holes that make that promise look fake.

---

## Scoreboard

| Dimension | Chewy | Petshiwu (live) | Gap |
|---|---|---|---|
| SKUs | ~190,000 | **8,775** | ~22× smaller |
| Brands | ~3,000–4,000 | **353** | ~10× smaller |
| Active customers | 21.5M (Q1 FY26) | Launch-stage | Scale |
| Net sales | $12.6B FY25 | n/a | Scale |
| Autoship share of sales | **83–84%** | None (by design) | Different model |
| Pharmacy / Rx meds | 4,000+ meds, licensed pharmacists | **0 pharmacy SKUs** | Critical for health wallet |
| Same-day | Partner/Instacart in some markets; core is 1–3 day | **Own warehouse, NYC tonight** | Our structural win |
| Returns | **365 days**, free return shipping | **30 days**, unused/unopened | Trust gap |
| Support | 24/7 phone + chat, licensed vet chat | 9am–8pm ET phone/email | Coverage gap |
| Native app | iOS + Android | Web only | Channel gap |
| Reviews | Millions of UGC ratings | Near-zero on most SKUs | Conversion gap |
| Private label | Frisco, Chewy Made, Get Real, American Journey, etc. | None | Margin gap (later) |
| Horse / farm | SmartEquine (acquired Q1 2026) | **0 horse SKUs** | Ignore for now |
| Membership | Chewy+ $79/yr | None (by design) | Fine |

---

## What Chewy actually is in 2026

Chewy is no longer “an online pet store.” It is a **health + subscription ecosystem** with a retail catalog attached.

From Chewy’s own about page and FY25/Q1 FY26 disclosures:

1. **Autoship** — ~84% of net sales. 35% off first Autoship order, 5% ongoing. This is the business.
2. **Chewy Pharmacy** — licensed pharmacists, vet Rx approval, 4,000+ medications, compounded meds, 600+ veterinary diets.
3. **Connect with a Vet** — 24/7 licensed vet chat/video, symptom tracker, consult reports.
4. **Chewy Vet Care** — in-person clinics; targeting ~60 clinics by end of FY2026 after Modern Animal. Clinic customers spend ~$900 NSPAC vs ~$597 overall.
5. **CarePlus** — pet insurance / wellness (Trupanion / Lemonade).
6. **Chewy+** — $79/year membership: free shipping with no minimum, 5% rewards.
7. **Private label** — Frisco, Chewy Made, Get Real (fresh), plus legacy brands.
8. **PetMD** — owned health content at national scale.
9. **Practice Hub** — vet-clinic marketplace so clinics sell through Chewy.
10. **Equine** — SmartPak / SmartEquine acquired Q1 2026.
11. **Service culture** — 365-day returns, 24/7 humans, handwritten notes, sympathy flowers, donate-don’t-return.
12. **Seasonal merch machine** — Halloween costumes were the live homepage when audited.

**Chewy’s real weakness vs us:** they cannot honestly promise “order by 3 PM, at your NYC door tonight” from a Queens warehouse. Their same-day is partner logistics, not a local fleet. They also lock people into Autoship, which a slice of NYC shoppers resent.

---

## What we already have that Chewy does not (protect these)

Do not dilute these. They are the only reasons a Chewy customer switches.

| Asset | Why it matters |
|---|---|
| **True same-day NYC** from Jackson Heights, cutoff 3 PM / 1 PM weekends, before 11 PM | Chewy cannot match this with a Midwest DC |
| **No Autoship required** + FREEDOM20 | Direct counter to Chewy’s 84% subscription machine |
| **Local driver app / delivery runs** | Operational moat, not a webpage |
| **ZIP tonight checker** | Makes the promise testable in 5 seconds |
| **Photo search + voice search** | Faster than typing a 40-character bag name on a phone in an elevator |
| **Neighborhood pages** (all 5 boroughs) | Chewy has almost no NYC local content |
| **Symptom checker** (triage, not diagnosis) | Lightweight Connect-with-a-Vet substitute |
| **Pet profiles** on the user account (breed, weight, allergies, birthday) | Foundation for personalization Chewy charges an ecosystem for |
| **COD + Stripe/PayPal** | Relevant for NYC cash / building-access reality |

---

## What we lack — ranked by market damage

Priority is “does this lose a sale this week in NYC,” not “does Chewy have it.”

### P0 — Catalog honesty (we claim it, we don’t stock it)

These gaps break trust because the homepage, GBP, and SEO pages name brands that are missing or token.

| Claimed / expected | Live reality | Why it hurts |
|---|---|---|
| **10,000+ products** | **8,775** | Easy to audit; looks inflated |
| **Orijen** (homepage + SEO) | **0 SKUs** | Premium shoppers bounce |
| **Acana / Open Farm / Farmina / Fromm / Taste of the Wild** | **0** | Same premium aisle |
| **Hill’s Science Diet** | **3 SKUs** | Chewy has hundreds; this is table stakes |
| **Hill’s Prescription Diet** | Products exist in search (~110 “Prescription Diet” hits) but **brand filter returns 0** (HTML-entity brand names) | Shoppers using brand nav see nothing |
| **Flea & tick aisle** | Seresto **1**, Frontline **0**, NexGard **0**, Bravecto **0**, Advantage **0** | Summer/year-round demand; high margin |
| **Heartworm / Rx meds** | Heartgard **0**, Interceptor **0**, Apoquel **0**, Revolution (brand) **0** | Entire Chewy Pharmacy wallet |
| **Bird** | **46 SKUs** | Footer advertises birds; aisle is empty |
| **Horse** | **0** | Fine to skip. Do not advertise it. |
| **“Other Animals” pet type** | **0 products** | Dead nav node |
| **Reviews** | 200-SKU sample: **0 reviews** on list payloads; a few products have 3–7 | Chewy PDPs convert on social proof. Ours look unlaunched. |
| **Featured merchandising** | **10** featured SKUs | Chewy homepage is a promo engine |

**Fix first (assortment, not features):**

1. Fill **Hill’s Science Diet** to a real line (puppy/adult/senior, small/large, wet/dry, cat + dog). Target 80–150 SKUs, not 3.
2. Make **Hill’s Prescription Diet / Royal Canin Veterinary / Purina VD** shoppable by brand (fix `Hill&#039;s` encoding so filters work).
3. Either **stock Orijen** or **remove Orijen from homepage/SEO copy**. Same for Acana/Open Farm if we keep “premium.”
4. Build a real **OTC parasite aisle**: Seresto, Frontline, Advantage, plus collars/topicals we can legally sell without a pharmacy license.
5. Do not say “10,000+” until the API total is actually ≥10,000.

### P0 — Prescription food promise vs pharmacy reality

Homepage FAQ currently says:

> We carry Hill’s Prescription Diet, Royal Canin Veterinary Diet, and Purina Pro Plan Veterinary Diets. Your vet can upload or fax the prescription at checkout, and we ship same-day for most prescription orders.

Live:

- Royal Canin Veterinary Diet: **62** SKUs  
- Purina Pro Plan Veterinary Diets: **23**  
- Blue Buffalo Natural Veterinary Diet: **11**  
- Hill’s Prescription Diet: present in search, **broken as a brand facet**  
- **No pharmacy, no Rx-upload checkout flow, no vet-approval workflow, no licensed pharmacist**

Veterinary *food* can be sold OTC in many cases. Veterinary *drugs* cannot. We are mixing those in copy.

**Gap:** Chewy’s health wallet (pharmacy + Rx approval + Autoship on meds) is their highest-margin, highest-retention loop. We cannot clone a licensed pharmacy this quarter.

**Do this instead:**

- Keep **vet diets as food**, with a clear “check with your vet” note — no fake fax-Rx theater until it exists.
- Add a real **Rx-food checkout flag** only after ops can verify the script.
- Do **not** advertise Apoquel/NexGard/Heartgard until we have a licensed pharmacy partner.

### P1 — Trust and post-purchase (why Chewy still wins even when slower)

| Chewy | Petshiwu | Market effect |
|---|---|---|
| 365-day free returns | 30-day, unused/unopened | “What if the bag is wrong?” — Chewy wins |
| 24/7 humans + vet chat | 9am–8pm ET | Nighttime NYC emergencies go to Chewy or a vet |
| Millions of reviews | Almost none | PDP add-to-cart drops |
| Gift cards + account credit | Search “gift card” returns toys, not cards | Gifting / refunds |
| Native app + medicine reminders | Web + PWA-ish | Reorder habit lives in Chewy’s app |
| Sympathy / handwritten notes | None | Chewy’s brand is “they care” |
| Seasonal campaigns (Halloween live now) | 232 costume SKUs exist, homepage does not merchandise them | We stock seasonality but don’t sell it |

**Highest-leverage trust moves (still on-brand):**

1. **UGC reviews.** Seed is not enough. Post-delivery review SMS/email with a photo prompt. Chewy’s PDPs work because the rating is the first thing you see.
2. **One-click reorder** from order history (we already tell SEO pages this exists — make it the default CTA on My Orders).
3. **Extend returns on unopened food to 90 days** (not 365). 30 days is below market for a $70 bag.
4. **Live chat during 9am–8pm** before 24/7. Chewy’s 24/7 is expensive; NYC shoppers still expect *someone* on the site.
5. **Homepage seasonal rail.** We already have 229 Halloween / 232 costume hits. Chewy’s homepage was 100% Halloween when audited. Ours was generic “premium pet food.”

### P1 — Health-adjacent products we can sell without becoming a pharmacy

Chewy’s homepage lead is Pharmacy + flea/tick. Ours is food. Food is the trip; health is the margin.

**Stock and merchandising gaps we can close without a DEA/pharmacy license:**

- Flea & tick OTC (collars, topicals, sprays, yard treatments)
- Dental chews (we have a category; push it)
- Joint supplements (Dasuquin, Cosequin, glucosamine lines)
- Calming (Feliway is in catalog — merchandising is weak)
- Probiotics / digestive (Hill’s GI is 3 SKUs of Science Diet)
- Litter depth (78 litter hits — thin vs Chewy’s wall of litter)
- Fresh / gently cooked: Freshpet 23, JustFoodForDogs 13, NOM NOM 7 — enough to build a “fresh NYC tonight” rail that Chewy’s frozen Get Real cannot match locally

**Skip for 2026:** compounded meds, Heartgard, Apoquel, NexGard, Bravecto, clinic network, CarePlus insurance, Practice Hub.

### P2 — Aisles and pet types that look unfinished

Live mix:

| Pet | SKUs | Share | Verdict |
|---|---|---|---|
| Dog | 5,515 | 63% | Core. Still missing premium kibble brands. |
| Cat | 2,768 | 32% | Core. Litter + Rx urinary is the NYC cat wallet. |
| Fish | 207 | 2.4% | Keep; don’t expand until dog/cat is dense. |
| Reptile | 136 | 1.6% | Keep a tight Exo-Terra / Fluker’s set. |
| Small pet | 103 | 1.2% | Too thin for “we sell small pets.” |
| Bird | 46 | 0.5% | Either 300 SKUs or drop birds from the mega-menu. |
| Horse | 0 | 0% | Chewy just bought SmartEquine. Not our war. |

Category tree is Chewy-shaped (crates, costumes, car barriers) but **top-level nav is only 11 parents**, with duplicates (`Dry Food` twice, `Food Toppers` twice, `Biscuits` twice) and HTML entities (`Cages, Habitats &amp; Hutches`). That is a merchandising bug, not a strategy gap.

### P2 — Features Chewy has that we should not copy yet

| Chewy feature | Why not now |
|---|---|
| Autoship (83% of their sales) | Our brand is the anti-Autoship. Optional 5% reorder reminder is enough. Homepage FAQ currently contradicts SEO (“opt into autoship for 5%”). Pick one story. |
| Chewy+ membership | We already shout “no membership fee.” Don’t add a $79 club. |
| Vet clinics / Modern Animal | Capital + licensing + 18–60 sites. Not a startup move. |
| Pet insurance | Partnership-heavy, low brand credit, not NYC-same-day. |
| Equine / farm | Wrong geography and warehouse. |
| Private label (Frisco clone) | Chewy uses PL for margin. We need brand density first or we look like a generic Amazon reseller. |
| Native iOS/Android | After reorder + push “bag is low” works on the web. Driver app already exists. |
| 190k SKU parity | We need **the right 12–15k**, not 190k. Depth in Hill’s / Royal Canin / Blue / Purina / flea-tick / litter beats a long tail of hamster wheels. |

### P3 — Experience Chewy still does better on the site itself

- **Promo engine:** $20 eGift on $49+, 50% first Pharmacy Autoship, Buy 3 Get 4th Free. We have FREEDOM20 (20% max $10) — weaker than Chewy’s first-order hook.
- **PDP social proof:** ratings, Q&A, “customers also bought,” autoship toggle.
- **Search:** Chewy invests in AI relevance. We have text index + photo search (photo is a real differentiator if it works on bag photos).
- **App pharmacy reminders:** “don’t run out of Apoquel.” Our equivalent is **don’t run out of the 30-lb bag tonight** — a stock-alert / reorder SMS, not a clinic.
- **Content:** PetMD vs our Learning hub. We can win NYC queries; we will not win “best dog food” nationally this year (see `CHEWY_KEYWORDS.md`).

---

## Positioning: where to attack, where to concede

### Attack (Chewy is structurally weak)

1. **Tonight in NYC.** Heavy bags, no car, walk-ups, 3 PM cutoff. Repeat this everywhere Chewy says “free 1–3 day shipping.”
2. **No subscription lock.** Their Autoship is the product. A loud, true “buy once” is a wedge — but only if reorder is one tap, or people will still stay on Chewy for convenience.
3. **Vet diets *tonight*.** Chewy ships Rx food in 1–3 days. A cat on c/d who runs out Friday afternoon is ours — if Hill’s Prescription Diet actually appears in brand nav.
4. **Fresh / refrigerated.** Freshpet and JustFoodForDogs on a same-day route is something a national DC cannot do well.
5. **Local SEO / GBP.** Already in motion. Chewy will not write Jackson Heights neighborhood pages.

### Concede (do not spend 2026 here)

- National 1–2 day to Iowa  
- Licensed pharmacy  
- 24/7 vet video  
- Horse  
- Private-label toys at Frisco scale  
- $79 membership  
- 190k SKU catalog  

### Messaging bug to fix this week

We currently run **three Autoship stories**:

- SEO / GBP: “No autoship.”
- Homepage FAQ: “Never required, but opt in for 5%.”
- README / seed data: `autoshipEligible` flags exist.

Pick one. Recommended: **No Autoship. One-tap reorder. Optional “remind me in 4 weeks” SMS.** That is the Chewy gap without becoming Chewy.

Second messaging bug: **Orijen / 10,000+ / vet fax-Rx** on live pages while the catalog disagrees. Chewy does not have this problem. Shoppers who catch it assume the whole store is vapor.

---

## Recommended 90-day market response (not a Chewy clone)

### Days 1–21 — Stop looking incomplete

1. Catalog truth pass: remove Orijen (and any other zero-SKU brands) from all public copy, or list the SKUs.
2. Fix brand encoding so Hill’s Prescription Diet filters work.
3. Expand Hill’s Science Diet + Prescription Diet + Royal Canin VD to a shoppable set.
4. OTC flea/tick endcap on homepage (even 15 SKUs beats hiding Seresto in search).
5. Seasonal homepage rail (Halloween is live at Chewy *now*).
6. One Autoship sentence, used everywhere.

### Days 22–60 — Steal the “ran out tonight” job

7. One-tap reorder + “buy again” on My Orders and PDPs.
8. Bag-empty reminder (pet profile + last order date). This is our Autoship without Autoship.
9. Post-delivery review request (photo + 1 tap). Target 20% of SKUs with ≥5 reviews, starting with top 200 sellers.
10. 90-day unopened-food returns.
11. Live chat 9am–8pm.

### Days 61–90 — Health wallet without a pharmacy

12. Litter + urinary + sensitive-stomach bundles merchandised for NYC apartments.
13. Fresh-food same-day rail (Freshpet / JFFD / Nom Nom).
14. Clear vet-diet landing page that does **not** promise a fax-Rx pharmacy.
15. Bird: either 300 SKUs or remove from primary nav.

---

## Do not measure ourselves on Chewy’s scoreboard

Chewy’s north stars: Autoship mix, NSPAC ($597), active customers (21.5M), pharmacy attach, clinic count.

**Ours should be:**

- Same-day attach rate on NYC ZIPs (order before cutoff → delivered tonight)
- Repeat purchase within 35 days (the anti-Autoship metric)
- In-stock rate on Hill’s / Royal Canin / Blue / Purina / Seresto
- PDP conversion on SKUs with vs without reviews
- “Tonight” SERP share for `dog food same day delivery` / `pet supplies NYC` (already in `CHEWY_KEYWORDS.md`)

If those four move, Chewy’s 190,000 SKUs do not matter in Queens.

---

## Source notes (August 19, 2026)

- Chewy.com homepage, About, Chewy+ membership, returns help  
- Chewy FY2025 10-K commentary (~190k products, ~4,000 brands, $12.6B sales, 83.3% Autoship, 21.3M FY25 customers)  
- Chewy Q1 FY2026: 21.5M active customers, ~$3.36B sales, SmartEquine close, ~60 clinics FY26 target, NSPAC $597  
- Chewy iOS app listing: 4,000+ meds, 600+ vet diets, 24/7 experts  
- Petshiwu live API: `/api/products` total 8775; `/api/products/brands` 353; `/api/categories` 169; pet-type splits as tabled above

#!/usr/bin/env python3
"""
Adds size/count variants to stain & odor removers and wipes that
don't already have size info in their names.
"""

import urllib.request, json, time, hashlib, re
from concurrent.futures import ThreadPoolExecutor, as_completed

API      = 'https://petshiwu.onrender.com/api/v1'
HEADERS  = {'Content-Type': 'application/json', 'Accept': 'application/json'}
EMAIL    = 'admin@petshiwu.com'
PASSWORD = '@Admin,1+23as'

HAS_SIZE = re.compile(
    r'\d+\s*(?:fl\.?\s*oz|oz|ounce|count|ct\b|lb\b|gallon|gal\b|ml\b|liter)', re.I)

TARGET_CATS = ['stain & odor', 'wipes & deodorizer']


# ── Nature's Miracle spray cleaners ─────────────────────────────────────────
# Products that are standard spray bottles (not foam, laundry, air care, carpet, wipes)
NM_SPRAY_SKIP = re.compile(
    r'\bfoam\b|\blaundry\b|\bair care\b|\bcarpet shampoo\b|\bbath wipes\b|\bgel bead', re.I)

# PetSmart Nature's Miracle spray size tiers (per 24/32oz/gallon)
NM_TIERS = [
    ('24 oz',   8.0,  12.5,  1.000),
    ('32 oz',  12.5,  17.0,  1.275),
    ('1 gallon', 26.0, 40.0, 2.910),
]

# ── Skout's Honor sprays ─────────────────────────────────────────────────────
# Skip laundry booster and outdoor turf (specialty/fixed)
SH_SKIP = re.compile(r'\blaundry\b|\boutdoor turf\b|\bconcrete\b', re.I)

SH_TIERS = [
    ('8 oz',  12.0, 17.0, 1.000),
    ('32 oz', 19.0, 28.0, 1.650),
]

# ── Pet Parents WiPees ───────────────────────────────────────────────────────
PP_TIERS = [
    ('100 ct', 11.0, 18.0, 1.000),
    ('200 ct', 18.0, 38.0, 1.650),
]

# ── Top Paw wipes (no count in name) ────────────────────────────────────────
TP_TIERS = [
    ('100 ct', 6.0, 14.0, 1.000),
    ('200 ct', 14.0, 25.0, 1.650),
]

# ── Angry Orange ─────────────────────────────────────────────────────────────
AO_TIERS = [
    ('8 oz',   10.0, 15.0, 1.000),
    ('32 oz',  16.0, 24.0, 2.000),
    ('1 gallon', 28.0, 50.0, 3.800),
]

# ── Only Natural Pet stain sprays ────────────────────────────────────────────
ONP_SPRAY_SKIP = re.compile(r'\bwipes\b|\battracting\b|\btraining\b', re.I)
ONP_TIERS = [
    ('16 oz', 10.0, 17.0, 1.000),
    ('32 oz', 17.0, 30.0, 1.750),
]


def find_tier(price, tiers):
    """Return index of the tier this price belongs to. Falls back to closest midpoint."""
    for i, (_, lo, hi, _) in enumerate(tiers):
        if lo <= price <= hi:
            return i
    mids = [(lo + hi) / 2 for _, lo, hi, _ in tiers]
    return min(range(len(mids)), key=lambda i: abs(price - mids[i]))


def build_variants_from_tiers(base_price, tiers, current_idx, sku_prefix, name, images, stock):
    base_ratio = tiers[current_idx][3]
    smallest   = round(base_price / base_ratio, 2)
    variants   = []
    for size, lo, hi, ratio in tiers:
        price = round(smallest * ratio, 2)
        variants.append({
            'sku':     f'{sku_prefix}-' + hashlib.md5(f"{name}-{size}-{int(time.time()*1000)%99999}".encode()).hexdigest()[:8].upper(),
            'size':    size,
            'price':   price,
            'stock':   stock,
            'inStock': True,
            'images':  images,
        })
    return variants


def classify(brand, name, price):
    """Return (tiers, current_idx) or None if should be skipped."""
    brand_l = brand.lower()
    name_l  = name.lower()

    if "nature's miracle" in brand_l or "nature's miracle" in name_l:
        if NM_SPRAY_SKIP.search(name):
            return None
        return NM_TIERS, find_tier(price, NM_TIERS)

    if "skout" in brand_l:
        if SH_SKIP.search(name):
            return None
        return SH_TIERS, find_tier(price, SH_TIERS)

    if "pet parents" in brand_l:
        if 'wipes' in name_l or 'wipees' in name_l:
            return PP_TIERS, find_tier(price, PP_TIERS)
        return None

    if "top paw" in brand_l:
        if 'wipes' in name_l:
            return TP_TIERS, find_tier(price, TP_TIERS)
        return None

    if "angry orange" in brand_l:
        if 'stain' in name_l or 'odor' in name_l:
            return AO_TIERS, find_tier(price, AO_TIERS)
        return None

    if "only natural pet" in brand_l:
        if ONP_SPRAY_SKIP.search(name):
            return None
        if 'stain' in name_l or 'odor' in name_l or 'urine' in name_l:
            return ONP_TIERS, find_tier(price, ONP_TIERS)
        return None

    return None


def login():
    data = json.dumps({'email': EMAIL, 'password': PASSWORD}).encode()
    req  = urllib.request.Request(f'{API}/auth/login', data=data, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['token']


def fetch_page(pg):
    req = urllib.request.Request(
        f'{API}/products?limit=100&page={pg}',
        headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=12) as r:
        d = json.loads(r.read())
    out = []
    for p in d.get('data', []):
        cat = (p.get('category') or {})
        cn  = (cat.get('name', '') if isinstance(cat, dict) else '').lower()
        if not any(t in cn for t in TARGET_CATS):
            continue
        if len(p.get('variants', [])) > 1:
            continue
        if HAS_SIZE.search(p['name']):
            continue
        v     = (p.get('variants') or [{}])[0]
        price = v.get('price', 0) or 0
        brand = p.get('brand', '') or ''
        result = classify(brand, p['name'], price)
        if result is None:
            continue
        tiers, tier_idx = result
        out.append({
            'id':       p['_id'],
            'name':     p['name'],
            'brand':    brand,
            'price':    price,
            'tiers':    tiers,
            'tier_idx': tier_idx,
            'images':   v.get('images', p.get('images', [])) or [],
            'stock':    v.get('stock', 30),
        })
    return out


def update_product(pid, variants, token):
    data = json.dumps({'variants': variants}).encode()
    req  = urllib.request.Request(
        f'{API}/products/{pid}',
        data=data,
        headers={**HEADERS, 'Authorization': f'Bearer {token}'},
        method='PUT')
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status


def main():
    print('Logging in...')
    token = login()
    print('OK\n')

    print('Scanning products...')
    targets = []
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(fetch_page, pg): pg for pg in range(1, 102)}
        for f in as_completed(futs):
            try: targets.extend(f.result())
            except Exception as e: print(f'  page error: {e}')

    print(f'Found {len(targets)} products to update\n')

    from collections import defaultdict
    by_brand = defaultdict(list)
    for t in targets: by_brand[t['brand']].append(t)

    print('Preview by brand:')
    for brand, items in sorted(by_brand.items(), key=lambda x: -len(x[1])):
        print(f'\n  {brand} ({len(items)}):')
        for p in sorted(items, key=lambda x: x['price'])[:4]:
            variants = build_variants_from_tiers(
                p['price'], p['tiers'], p['tier_idx'],
                'SO', p['name'], p['images'], p['stock'])
            size_str = ' | '.join(f"{v['size']} ${v['price']:.2f}" for v in variants)
            print(f"    {p['name'][:52]:<52} → {size_str}")

    print(f'\nUpdating all {len(targets)}...')
    updated = errors = 0

    def do_update(p):
        v = build_variants_from_tiers(
            p['price'], p['tiers'], p['tier_idx'],
            'SO', p['name'], p['images'], p['stock'])
        return update_product(p['id'], v, token) == 200

    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(do_update, p): p for p in targets}
        for i, f in enumerate(as_completed(futs), 1):
            try:
                if f.result(): updated += 1
                else:          errors  += 1
            except Exception as e:
                errors += 1
            if i % 10 == 0 or i == len(targets):
                print(f'  [{i}/{len(targets)}] updated={updated} errors={errors}')

    print(f'\nDone. Updated: {updated} | Errors: {errors}')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Vet diet dry food variants — adds bag size options to prescription/veterinary diet
dry food products (price > $15) matching PetSmart sizing.
"""

import urllib.request, json, time, hashlib, re
from concurrent.futures import ThreadPoolExecutor, as_completed

API      = 'https://petshiwu.onrender.com/api/v1'
HEADERS  = {'Content-Type': 'application/json', 'Accept': 'application/json'}
EMAIL    = 'admin@petshiwu.com'
PASSWORD = '@Admin,1+23as'

VET_CATS = ['veterinary diet', 'vet-authorized diet']

# ── Size definitions ─────────────────────────────────────────────────────────
# Each brand+species combo: list of (size_label, price_multiplier_from_smallest)
# Multipliers derived from PetSmart actual pricing ratios.

# Each entry: (size_label, typical_min_price, typical_max_price, ratio_from_smallest)
# Price ranges derived from PetSmart actuals. Used to identify which tier a product
# currently represents, then all tiers are scaled proportionally.

TIERS = {
    ('hill', 'cat'): [
        ('3.85 lb', 33, 48,  1.000),
        ('7.7 lb',  60, 82,  1.850),
        ('15.4 lb', 95, 130, 2.950),
    ],
    ('hill', 'dog'): [
        ('6 lb',    35, 58,  1.000),
        ('17.6 lb', 68, 100, 1.850),
        ('27.5 lb', 105, 145, 2.900),
    ],
    ('royal canin', 'cat'): [
        ('6.6 lb',  28, 54,  1.000),
        ('13.2 lb', 54, 95,  1.800),
    ],
    ('royal canin', 'dog_small'): [
        ('4.4 lb', 28, 60,  1.000),
        ('8.8 lb', 52, 90,  1.750),
    ],
    ('royal canin', 'dog'): [
        ('7.7 lb',  30, 58,  1.000),
        ('17.6 lb', 56, 100, 1.850),
        ('28.6 lb', 95, 130, 2.900),
    ],
    ('purina', 'cat'): [
        ('3.5 lb', 38, 56,  1.000),
        ('7 lb',   65, 92,  1.800),
        ('14 lb',  98, 125, 2.800),
    ],
    ('purina', 'dog'): [
        ('6 lb',  38, 58,  1.000),
        ('16 lb', 68, 100, 2.000),
        ('28 lb', 105, 130, 3.200),
    ],
    ('blue buffalo', 'cat'): [
        ('4 lb',   45, 68,  1.000),
        ('8.5 lb', 80, 105, 1.850),
    ],
    ('blue buffalo', 'dog'): [
        ('6.5 lb', 48, 72,  1.000),
        ('22 lb',  115, 145, 2.700),
    ],
    ('generic', 'cat'): [
        ('4 lb',   30, 58,  1.000),
        ('8.5 lb', 55, 95,  1.850),
    ],
    ('generic', 'dog'): [
        ('7 lb',  30, 62,  1.000),
        ('17 lb', 58, 100, 1.800),
    ],
}


def resolve_sizes_and_prices(brand: str, name: str, current_price: float):
    """
    Return [(size_label, price), ...] for a vet diet dry food product.
    Maps current price to the correct size tier, then builds the full set.
    """
    brand_l = brand.lower()
    name_l  = name.lower()

    is_cat        = any(w in name_l for w in ['cat', 'feline', 'kitten'])
    is_small_breed = any(w in name_l for w in ['small breed', 'small dog', 'satiety support'])

    # Pick tier key
    if 'hill' in brand_l:
        key = ('hill', 'cat' if is_cat else 'dog')
    elif 'royal canin' in brand_l:
        if is_cat:
            key = ('royal canin', 'cat')
        elif is_small_breed:
            key = ('royal canin', 'dog_small')
        else:
            key = ('royal canin', 'dog')
    elif 'purina' in brand_l:
        key = ('purina', 'cat' if is_cat else 'dog')
    elif 'blue' in brand_l:
        key = ('blue buffalo', 'cat' if is_cat else 'dog')
    else:
        key = ('generic', 'cat' if is_cat else 'dog')

    tiers = TIERS[key]

    # Find which tier the current price belongs to by checking price ranges.
    # If no range matches, pick the closest midpoint.
    matched_idx = None
    for i, (size, lo, hi, ratio) in enumerate(tiers):
        if lo <= current_price <= hi:
            matched_idx = i
            break

    if matched_idx is None:
        # Fall back: pick tier whose midpoint is closest
        mids = [(lo + hi) / 2 for _, lo, hi, _ in tiers]
        matched_idx = min(range(len(mids)), key=lambda i: abs(current_price - mids[i]))

    # Back-calculate smallest tier price from current
    base_ratio = tiers[matched_idx][3]
    base_price = round(current_price / base_ratio, 2)

    result = []
    for size, lo, hi, ratio in tiers:
        price = round(base_price * ratio, 2)
        result.append((size, price))
    return result


def make_sku(name: str, size: str) -> str:
    key = f"{name}-{size}-{int(time.time()*1000) % 99999}"
    return 'VET-' + hashlib.md5(key.encode()).hexdigest()[:8].upper()


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
        if not any(t in cn for t in VET_CATS):
            continue
        # Allow re-running to fix previously set variants
        # if len(p.get('variants', [])) > 1: continue
        v = (p.get('variants') or [{}])[0]
        price = v.get('price', 0) or 0
        if price <= 15:   # wet food cans — skip
            continue
        # Skip non-food items (supplements, treats)
        name_l = p['name'].lower()
        if any(w in name_l for w in ['fortiflora','probiotic powder','supplement','dental treat','greenies','chew']):
            continue
        out.append({
            'id':     p['_id'],
            'name':   p['name'],
            'brand':  p.get('brand', '') or '',
            'price':  price,
            'images': v.get('images', p.get('images', [])) or [],
            'stock':  v.get('stock', 30),
        })
    return out


def build_variants(product):
    sizes_prices = resolve_sizes_and_prices(
        product['brand'], product['name'], product['price'])
    variants = []
    for size, price in sizes_prices:
        variants.append({
            'sku':     make_sku(product['name'], size),
            'size':    size,
            'price':   price,
            'stock':   product['stock'],
            'inStock': True,
            'images':  product['images'],
        })
    return variants


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

    print('Fetching vet diet products...')
    targets = []
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(fetch_page, pg): pg for pg in range(1, 102)}
        for f in as_completed(futs):
            try: targets.extend(f.result())
            except Exception as e: print(f'  page fetch error: {e}')

    print(f'Found {len(targets)} vet diet dry food products to update\n')

    # Preview first 5
    print('Preview (first 5):')
    for p in targets[:5]:
        sizes = resolve_sizes_and_prices(p['brand'], p['name'], p['price'])
        print(f"\n  {p['name'][:55]}")
        print(f"  Brand: {p['brand']} | Current: ${p['price']:.2f}")
        for size, price in sizes:
            print(f"    → {size:10s}  ${price:.2f}")

    print(f'\nUpdating all {len(targets)} products...')
    updated = errors = 0

    def do_update(p):
        variants = build_variants(p)
        status   = update_product(p['id'], variants, token)
        return status == 200

    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(do_update, p): p for p in targets}
        for i, f in enumerate(as_completed(futs), 1):
            try:
                if f.result(): updated += 1
                else:          errors  += 1
            except Exception as e:
                errors += 1
            if i % 20 == 0 or i == len(targets):
                print(f'  [{i}/{len(targets)}] updated={updated} errors={errors}')

    print(f'\nDone. Updated: {updated} | Errors: {errors}')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Shampoo & Conditioner variant expansion — matches PetSmart bottle sizes.
"""

import urllib.request, json, time, re, random
from concurrent.futures import ThreadPoolExecutor, as_completed

API = 'https://petshiwu.onrender.com/api/v1'
HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json'}
ADMIN_EMAIL = 'admin@petshiwu.com'
ADMIN_PASS  = '@Admin,1+23as'

SHAMPOO_CATS = ['shampoos & conditioners', 'shampoo', 'conditioner', 'grooming']

def login():
    data = json.dumps({'email': ADMIN_EMAIL, 'password': ADMIN_PASS}).encode()
    req = urllib.request.Request(f'{API}/auth/login', data=data, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['token']

def make_sku(product_name, size):
    slug = re.sub(r'[^a-z0-9]+', '-', (product_name + '-' + size).lower()).strip('-')
    ts = int(time.time() * 1000) % 10000000 + random.randint(0, 999)
    return f"{slug}-{ts}"

def make_variant(size, price, name='product'):
    return {
        'size': size, 'price': round(price, 2),
        'stock': 30, 'inStock': True,
        'sku': make_sku(name, size), 'images': []
    }

# ──────────────────────────────────────────────────────────────────────────────
# Rules: (match_fn, [(size_label, price), ...])
# match_fn receives dict: {brand, name, price}
# ──────────────────────────────────────────────────────────────────────────────
def nl(p): return p['name'].lower()
def bl(p): return p['brand'].lower()
def pr(p): return p['price']

RULES = [
    # ── TropiClean — 20 oz standard → also 1 Gallon ──────────────────────
    (lambda p: 'tropiclean' in bl(p) and 'oz' not in nl(p),
     [('20 oz', 13.99), ('20 oz Coconut', 14.99), ('1 Gallon', 54.99)]),

    # ── TropiClean with specific formula pricing ($14.99–$16.99) ─────────
    (lambda p: 'tropiclean' in bl(p) and pr(p) >= 14.99 and 'oz' not in nl(p),
     [('20 oz', 16.99), ('1 Gallon', 59.99)]),

    # ── Nature's Miracle small (8 oz, $7.49–$9.99) ───────────────────────
    (lambda p: "nature's miracle" in bl(p) and pr(p) <= 10.00 and 'oz' not in nl(p),
     [('8 oz', 7.49), ('16 oz', 11.79), ('32 oz', 18.99)]),

    # ── Nature's Miracle medium (16 oz, $11.00–$12.99) ───────────────────
    (lambda p: "nature's miracle" in bl(p) and 11.00 <= pr(p) <= 12.99 and 'oz' not in nl(p),
     [('8 oz', 7.49), ('16 oz', 11.79), ('32 oz', 18.99)]),

    # ── FURminator shampoo/conditioner (8.5 oz, $10.89) ──────────────────
    (lambda p: 'furminator' in bl(p) and pr(p) <= 11.00 and 'dry' not in nl(p) and 'oz' not in nl(p),
     [('8.5 oz', 10.89), ('16 oz', 14.99)]),

    # ── FURminator foaming/deshedding larger ($12.99–$14.99) ─────────────
    (lambda p: 'furminator' in bl(p) and 12.00 <= pr(p) <= 15.00 and 'oz' not in nl(p),
     [('8.5 oz', 10.89), ('16 oz', 14.99)]),

    # ── Burt's Bees for Pets (12 oz, $8.59–$9.49) ────────────────────────
    (lambda p: "burt's bees" in bl(p) and pr(p) <= 10.00 and 'oz' not in nl(p),
     [('12 oz', 8.59), ('32 oz', 12.99)]),

    # ── Burt's Bees larger ($12.99 = 32 oz) ──────────────────────────────
    (lambda p: "burt's bees" in bl(p) and 12.00 <= pr(p) <= 13.50 and 'oz' not in nl(p),
     [('12 oz', 8.59), ('32 oz', 12.99)]),

    # ── CHI for Dogs (16 oz, $10.29–$15.19) ──────────────────────────────
    (lambda p: 'chi' in bl(p) and 'oz' not in nl(p),
     [('8 oz', 10.29), ('16 oz', 13.99)]),

    # ── Earthbath (16 oz, $17.99) ─────────────────────────────────────────
    (lambda p: 'earthbath' in bl(p) and 'oz' not in nl(p),
     [('16 oz', 17.99), ('32 oz', 22.99)]),

    # ── Skout's Honor probiotic shampoo (16 oz, ~$21.99) ─────────────────
    (lambda p: "skout's honor" in bl(p) and 'oz' not in nl(p),
     [('16 oz', 21.99), ('32 oz', 34.99)]),

    # ── Earth Rated dog shampoo (16 oz, $17.99) ──────────────────────────
    (lambda p: 'earth rated' in bl(p) and pr(p) >= 15.00 and 'oz' not in nl(p),
     [('16 oz', 17.99), ('32 oz', 27.99)]),

    # ── Earth Rated waterless/no-rinse ($12.99) ──────────────────────────
    (lambda p: 'earth rated' in bl(p) and pr(p) <= 14.00,
     [('8 oz', 12.99), ('16 oz', 17.99)]),

    # ── Wahl dog shampoo (24 oz, $8.99) ──────────────────────────────────
    (lambda p: 'wahl' in bl(p) and 'oz' not in nl(p),
     [('24 oz', 8.99), ('1 Gallon', 39.99)]),

    # ── Hempz pet shampoo (16 oz, $14.99–$16.99) ─────────────────────────
    (lambda p: 'hempz' in bl(p) and 'oz' not in nl(p),
     [('8 oz', 11.99), ('16 oz', 16.99)]),

    # ── Only Natural Pet shampoo ($14.99) ────────────────────────────────
    (lambda p: 'only natural pet' in bl(p) and ('shampoo' in nl(p) or 'conditioner' in nl(p)),
     [('8 oz', 14.99), ('16 oz', 24.99)]),

    # ── Veterinary Formula shampoo ($9.99) ───────────────────────────────
    (lambda p: 'veterinary formula' in bl(p) and 'oz' not in nl(p),
     [('17 oz', 9.99), ('32 oz', 15.99)]),

    # ── Zesty Paws dog shampoo ($15.47) ──────────────────────────────────
    (lambda p: 'zesty paws' in bl(p) and ('shampoo' in nl(p) or 'conditioner' in nl(p)),
     [('16 oz', 15.47), ('32 oz', 24.99)]),

    # ── Warren London magic/color shampoo ($14.99) ────────────────────────
    (lambda p: 'warren london' in bl(p) and 'magic' in nl(p),
     [('8 oz', 14.99), ('16 oz', 24.99)]),

    # ── Warren London Critter Color ($13.99 = 4oz) ───────────────────────
    (lambda p: 'warren london' in bl(p) and 'color' in nl(p),
     [('4 oz', 13.99), ('8 oz', 19.99)]),

    # ── John Paul Pet shampoo ($10.22–$11.59) ────────────────────────────
    (lambda p: 'john paul' in bl(p) and 'oz' not in nl(p),
     [('16 oz', 10.22), ('32 oz', 17.99)]),

    # ── Bugalugs dog shampoo ($14.99) ────────────────────────────────────
    (lambda p: 'bugalugs' in bl(p) and 'oz' not in nl(p),
     [('8.4 oz', 14.99), ('16.9 oz', 24.99)]),

    # ── Pet Head shampoo ($15.99) ─────────────────────────────────────────
    (lambda p: 'pet head' in bl(p) and 'oz' not in nl(p),
     [('15.2 oz', 15.99), ('27 oz', 24.99)]),

    # ── Arm & Hammer dog shampoo ($6.99–$7.99) ───────────────────────────
    (lambda p: 'arm & hammer' in bl(p) and ('shampoo' in nl(p) or 'conditioner' in nl(p)),
     [('20 oz', 6.99), ('32 oz', 10.99)]),

    # ── DOUXO specialty shampoo/mousse ($20.99 = 16.9 oz) ────────────────
    (lambda p: 'douxo' in bl(p) and pr(p) <= 22.00 and 'oz' not in nl(p),
     [('6.7 oz', 20.99), ('16.9 oz', 20.99)]),

    # ── Hartz Groomer's Best shampoo ─────────────────────────────────────
    (lambda p: 'hartz' in bl(p) and ('shampoo' in nl(p) or 'conditioner' in nl(p)),
     [('18 oz', 6.99), ('32 oz', 10.99)]),

    # ── Top Paw — skip (size already in product name) ─────────────────────
    # (handled by 'oz' exclusion above)
]

def match_rule(product):
    p = {
        'brand': product.get('brand') or '',
        'name': product.get('name') or '',
        'price': 0
    }
    v = product.get('variants', [])
    p['price'] = v[0].get('price', product.get('basePrice', 0)) if v else 0
    name = p['name']
    for fn, size_prices in RULES:
        try:
            if fn(p):
                return [make_variant(sz, price, name) for sz, price in size_prices]
        except Exception:
            pass
    return None

def fetch_page(page):
    try:
        req = urllib.request.Request(f'{API}/products?limit=100&page={page}', headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as r:
            d = json.loads(r.read())
        results = []
        for p in d.get('data', []):
            cat = (p.get('category') or {})
            cn = (cat.get('name', '') if isinstance(cat, dict) else '').lower()
            if not any(c in cn for c in SHAMPOO_CATS): continue
            if len(p.get('variants', [])) > 1: continue
            results.append(p)
        return results
    except Exception as e:
        return []

def update_product(pid, new_variants, token):
    clean = [{k: v for k, v in var.items() if k != '_id'} for var in new_variants]
    payload = {'variants': clean, 'basePrice': clean[0]['price']}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f'{API}/products/{pid}', data=data,
        headers={**HEADERS, 'Authorization': f'Bearer {token}'}, method='PUT')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200
    except:
        return False

def main():
    print('Logging in...')
    token = login()
    print('OK\n')

    print('Fetching shampoo/conditioner products...')
    products = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(fetch_page, pg): pg for pg in range(1, 102)}
        for f in as_completed(futs):
            products.extend(f.result())
    print(f'Found {len(products)} single-variant shampoo products\n')

    matched, skipped = [], []
    for p in products:
        variants = match_rule(p)
        if variants:
            matched.append((p, variants))
        else:
            skipped.append(p)

    print(f'Matched: {len(matched)} | Skipped: {len(skipped)}\n')

    # Show skipped
    skip_brands = {}
    for p in skipped:
        b = p.get('brand') or 'Unknown'
        skip_brands[b] = skip_brands.get(b, 0) + 1
    print('Skipped brands:')
    for br, cnt in sorted(skip_brands.items(), key=lambda x: -x[1]):
        print(f'  {cnt:3d}  {br}')
    print()

    # Update in parallel
    updated = errors = done = 0

    def do_update(args):
        p, variants = args
        return update_product(p['_id'], variants, token)

    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(do_update, item): item for item in matched}
        for fut in as_completed(futs):
            done += 1
            if fut.result():
                updated += 1
            else:
                errors += 1
            if done % 20 == 0 or done == len(matched):
                print(f'  [{done}/{len(matched)}] updated={updated} errors={errors}')

    print(f'\nDone. Updated: {updated} | Errors: {errors} | Skipped: {len(skipped)}')

if __name__ == '__main__':
    main()

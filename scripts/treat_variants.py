#!/usr/bin/env python3
"""
Treat variant expansion — matches PetSmart sizes for food/treat products
Targets: Temptations, Friskies, Hartz, Fancy Feast, Churu, Inaba, Bonkers,
         Blue Buffalo, Pup-Peroni, Zuke's, Wellness, PureBites, Greenies Feline,
         Pedigree Dentastix, Edgard & Cooper, Bocce's Bakery, Pupford
"""

import urllib.request, json, time, re, random

API = 'https://petshiwu.onrender.com/api/v1'
HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json'}

ADMIN_EMAIL = 'admin@petshiwu.com'
ADMIN_PASS  = '@Admin,1+23as'

TREAT_CATS = [
    'treats', 'training treats', 'soft & chewy treats',
    'biscuits, cookies & bakery treats', 'jerky treats',
    'dental treats', 'frozen treats & ice cream'
]

def login():
    data = json.dumps({'email': ADMIN_EMAIL, 'password': ADMIN_PASS}).encode()
    req = urllib.request.Request(f'{API}/auth/login', data=data, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['token']

def make_sku(product_name, size):
    slug = re.sub(r'[^a-z0-9]+', '-', (product_name + '-' + size).lower()).strip('-')
    return f"{slug}-{int(time.time()*1000) % 10000000 + random.randint(0,999)}"

def make_variant(size, price, product_name='product'):
    return {
        'size': size,
        'price': round(price, 2),
        'stock': 30,
        'inStock': True,
        'sku': make_sku(product_name, size),
        'images': []
    }

# ---------------------------------------------------------------------------
# Pattern rules — (match_fn, size_price_list)
# match_fn receives dict: {brand, name, price}
# size_price_list is a list of (size_label, price) tuples
# Rules are checked in order; first match wins.
# Variants are built at match time so product name is available for SKU gen.
# ---------------------------------------------------------------------------
def nl(p): return p['name'].lower()
def bl(p): return p['brand'].lower()
def pr(p): return p['price']

RULES = [
    # ── Temptations Classic 3 oz → 3 sizes ──────────────────────────────
    (lambda p: 'temptations' in bl(p) and 2.45 <= pr(p) <= 2.75,
     [('3 oz', 2.59), ('6.3 oz', 3.99), ('16 oz', 7.99)]),

    # ── Temptations Mixups larger at $8.49 ───────────────────────────────
    (lambda p: 'temptations' in bl(p) and 8.00 <= pr(p) <= 9.00 and 'mixup' in nl(p),
     [('3 oz', 2.59), ('6.3 oz', 3.99), ('30 oz', 8.49)]),

    # ── Friskies Party Mix small 2.1 oz pouches ──────────────────────────
    (lambda p: 'friskies' in bl(p) and 'party mix' in nl(p) and pr(p) <= 2.10,
     [('2.1 oz', 1.79), ('6 oz', 9.79), ('20 oz', 10.99)]),

    # ── Hartz Delectables single pouches ($1.23–$1.30) ───────────────────
    (lambda p: 'hartz delectables' in bl(p) and pr(p) <= 1.40,
     [('1 Count', 1.29), ('12 Count', 12.99)]),

    # ── Fancy Feast Appetizers pouches ($1.29–$1.50) ─────────────────────
    (lambda p: 'fancy feast' in bl(p) and 'appetizer' in nl(p) and pr(p) <= 1.60,
     [('1 Count', 1.29), ('12 Count', 14.99)]),

    # ── Churu lickable cat treats 4-tube 2 oz ($3.99) ────────────────────
    (lambda p: bl(p) == 'churu' and pr(p) <= 4.50 and 'variety' not in nl(p) and 'senior' not in nl(p),
     [('2 oz (4 ct)', 3.99), ('5 oz (10 ct)', 7.99), ('25 oz (50 ct)', 14.99)]),

    # ── Inaba small single treats ($1.19–$1.40) ──────────────────────────
    (lambda p: bl(p) == 'inaba' and pr(p) <= 1.50,
     [('1 Count', 1.29), ('4 Count', 4.99)]),

    # ── Bonkers Purr Pops 4-count ($2.49) ────────────────────────────────
    (lambda p: 'bonkers' in bl(p) and 'purr pops' in nl(p) and pr(p) <= 3.00,
     [('4 Count', 2.49), ('8 Count', 4.99), ('12 Count', 8.99)]),

    # ── Blue Buffalo Bits/Wild Bits dog training treats ($4.99 = 4 oz) ───
    (lambda p: 'blue buffalo' in bl(p) and 'bit' in nl(p) and pr(p) <= 5.50,
     [('4 oz', 4.99), ('8 oz', 8.99), ('19 oz', 19.99)]),

    # ── Blue Buffalo Bursts cat treats ($8.99 = 5 oz) ────────────────────
    (lambda p: 'blue buffalo' in bl(p) and 'burst' in nl(p),
     [('2 oz', 4.99), ('5 oz', 8.99)]),

    # ── Pup-Peroni dog treats ($11.49 = 25 oz) ───────────────────────────
    (lambda p: 'pup' in bl(p) and 'peroni' in bl(p) and 10.00 <= pr(p) <= 12.00,
     [('5.6 oz', 3.29), ('15 oz', 6.99), ('25 oz', 11.49)]),

    # ── Zuke's Mini Naturals training treats ($5.99 = 3.5 oz) ────────────
    (lambda p: 'zuke' in bl(p) and 'mini naturals' in nl(p),
     [('3.5 oz', 5.99), ('6 oz', 9.99), ('16 oz', 19.99)]),

    # ── Wellness Tiny Trainers ($6.99 = 3 oz) ────────────────────────────
    (lambda p: 'wellness' in bl(p) and 'tiny trainers' in nl(p),
     [('3 oz', 6.99), ('6 oz', 9.99)]),

    # ── Wellness Rewarding Life soft treats ($7.99 = 4 oz) ───────────────
    (lambda p: 'wellness' in bl(p) and 'rewarding life' in nl(p),
     [('4 oz', 7.99), ('8 oz', 10.99)]),

    # ── Wellness Core Brainiac puppy treats ($6.99) ───────────────────────
    (lambda p: 'wellness' in bl(p) and 'brainiac' in nl(p),
     [('4 oz', 6.99), ('7 oz', 9.99)]),

    # ── PureBites freeze-dried cat treats ($5.99 = ~1 oz) ────────────────
    (lambda p: 'purebites' in bl(p) and 5.50 <= pr(p) <= 6.50
               and 'holiday' not in nl(p) and 'dog' not in nl(p),
     [('1.09 oz', 5.99), ('2.3 oz', 12.49)]),

    # ── PureBites+ freeze-dried dog treats ($12.49 = 3 oz) ───────────────
    (lambda p: 'purebites' in bl(p) and 11.00 <= pr(p) <= 13.50 and 'dog' in nl(p),
     [('3 oz', 12.49), ('6 oz', 20.99)]),

    # ── Greenies Feline SmartBites / dental ($3.29 = 2.1 oz) ─────────────
    (lambda p: 'greenies' in bl(p) and 'feline' in nl(p) and pr(p) <= 4.00,
     [('2.1 oz', 3.29), ('9.75 oz', 22.99)]),

    # ── Pedigree Dentastix (any size) ────────────────────────────────────
    (lambda p: 'pedigree' in bl(p) and 'dentastix' in nl(p),
     [('Small (28 ct)', 8.99), ('Medium (28 ct)', 10.99), ('Large (28 ct)', 14.99)]),

    # ── Edgard & Cooper training small bites ─────────────────────────────
    (lambda p: 'edgard' in bl(p) and 'take a bow' in nl(p),
     [('2.6 oz', 4.99), ('7 oz', 9.99)]),

    # ── Edgard & Cooper Snugglebug strips ────────────────────────────────
    (lambda p: 'edgard' in bl(p) and 'snugglebug' in nl(p),
     [('2.6 oz', 6.49), ('5.3 oz', 11.99)]),

    # ── Bocce's Bakery training treats ───────────────────────────────────
    (lambda p: 'bocce' in bl(p) and pr(p) <= 6.00 and 'training' in nl(p),
     [('3 oz', 5.49), ('6 oz', 9.99)]),

    # ── Bocce's Bakery soft & chewy ──────────────────────────────────────
    (lambda p: 'bocce' in bl(p) and 7.00 <= pr(p) <= 8.50 and ('soft' in nl(p) or 'chewy' in nl(p)),
     [('6 oz', 7.99), ('12 oz', 14.49)]),

    # ── Pupford freeze-dried training treats ─────────────────────────────
    (lambda p: 'pupford' in bl(p) and 'freeze' in nl(p) and pr(p) <= 6.00,
     [('0.75 oz', 4.99), ('4 oz', 11.49)]),

    # ── Pupford crunchies ────────────────────────────────────────────────
    (lambda p: 'pupford' in bl(p) and 'crunch' in nl(p),
     [('4 oz', 13.99), ('8 oz', 22.99)]),

    # ── Merrick dog treats ────────────────────────────────────────────────
    (lambda p: 'merrick' in bl(p) and pr(p) <= 8.50,
     [('4.5 oz', 7.99), ('10 oz', 12.99)]),

    (lambda p: 'merrick' in bl(p) and pr(p) >= 12.00,
     [('10 oz', 12.99), ('20 oz', 22.99)]),

    # ── Whimzees single dog dental treats — dog size variants ─────────────
    (lambda p: 'whimzees' in bl(p) and pr(p) <= 5.00
               and 'cat' not in nl(p) and 'puppy' not in nl(p) and 'bag' not in nl(p),
     [('XS', 2.39), ('S', 2.39), ('M', 2.99), ('L', 3.99), ('XL', 4.07)]),

    # ── Whimzees puppy pack ───────────────────────────────────────────────
    (lambda p: 'whimzees' in bl(p) and 'puppy' in nl(p) and pr(p) <= 11.00,
     [('S/M (14 ct)', 9.89), ('M/L (14 ct)', 9.89)]),

    # ── Milk-Bone GravyBones — 3 bag sizes ───────────────────────────────
    (lambda p: 'milk-bone' in bl(p) and 'gravy' in nl(p),
     [('7 oz', 3.59), ('19 oz', 6.49), ('40 oz', 12.99)]),

    # ── Milk-Bone Flavor Snacks (no oz in name) ───────────────────────────
    (lambda p: 'milk-bone' in bl(p) and 'flavor snacks' in nl(p) and 'oz' not in nl(p),
     [('7 oz', 3.99), ('19 oz', 6.49), ('40 oz', 12.99)]),

    # ── Milk-Bone Soft & Chewy / Dipped fixed snacks ─────────────────────
    (lambda p: 'milk-bone' in bl(p) and ('dipped' in nl(p) or 'soft' in nl(p)) and pr(p) <= 4.50,
     [('4.5 oz', 3.99), ('9 oz', 6.99)]),

    # ── Ark Naturals Kiss Me-ow dental cat chews ──────────────────────────
    (lambda p: 'ark naturals' in bl(p) and 'kiss me' in nl(p) and 'lick' not in nl(p),
     [('1 oz', 3.99), ('2.5 oz', 7.99)]),

    # ── Ark Naturals Breath Bursts / brushless toothpaste (dogs, by size) ─
    (lambda p: 'ark naturals' in bl(p) and ('breath' in nl(p) or 'brushless' in nl(p))
               and 'cat' not in nl(p),
     [('Small/Medium', 7.19), ('Large/Xtra Large', 8.69), ('Giant', 12.99)]),

    # ── Viva La Kitty puree single tube ($0.99) ───────────────────────────
    (lambda p: 'viva la kitty' in bl(p) and 'puree' in nl(p) and pr(p) <= 1.50,
     [('1 Count', 0.99), ('6 Count', 5.29), ('12 Count', 9.99)]),

    # ── Viva La Kitty freeze-dried nibs ──────────────────────────────────
    (lambda p: 'viva la kitty' in bl(p) and 'freeze' in nl(p),
     [('0.5 oz', 4.99), ('1 oz', 4.99)]),

    # ── Bil-Jac Little-Jacs training treats ──────────────────────────────
    (lambda p: 'bil-jac' in bl(p) and 'jac' in nl(p) and pr(p) <= 4.50,
     [('4 oz', 2.99), ('10 oz', 5.99), ('30 oz', 12.99)]),

    # ── Bil-Jac Smart-Jacs digestive treats ──────────────────────────────
    (lambda p: 'bil-jac' in bl(p) and 'smart' in nl(p),
     [('4 oz', 6.99), ('10 oz', 12.99)]),

    # ── Natural Balance Mini Rewards ─────────────────────────────────────
    (lambda p: 'natural balance' in bl(p) and 'mini rewards' in nl(p),
     [('4 oz', 6.99), ('16 oz', 19.99)]),

    # ── Pet Botanics Puppy Bites training treats ──────────────────────────
    (lambda p: 'pet botanics' in bl(p) and 'puppy' in nl(p),
     [('5 oz', 6.29), ('20 oz', 15.99)]),

    # ── Pet Botanics Mini Training Reward ────────────────────────────────
    (lambda p: 'pet botanics' in bl(p) and 'mini' in nl(p) and pr(p) >= 10.00,
     [('5 oz', 11.69), ('15 oz', 19.99)]),

    # ── True Chews / Blue Buffalo True Chews ($13.99) ─────────────────────
    (lambda p: 'true chews' in bl(p) and pr(p) <= 14.50,
     [('5 oz', 7.99), ('10 oz', 12.99), ('12 oz', 13.99)]),

    # ── Cookie Pal soft chewy treats ($3.99-$4.00 small bag) ─────────────
    (lambda p: 'cookie pal' in bl(p) and pr(p) <= 4.50,
     [('4.5 oz', 3.99), ('8.8 oz', 8.99)]),

    # ── ROAM single-serve jerky ($3.99) ───────────────────────────────────
    (lambda p: 'roam' in bl(p) and pr(p) <= 4.50 and 'dog' in nl(p),
     [('1 oz', 3.99), ('4 oz', 12.99)]),

    # ── Shameless Pets crunchy biscuits ($3.97 = 5oz) ────────────────────
    (lambda p: 'shameless' in bl(p) and pr(p) <= 4.50,
     [('5 oz', 3.97), ('11 oz', 7.99)]),

    # ── Shameless Pets jerky treats ($7.99) ──────────────────────────────
    (lambda p: 'shameless' in bl(p) and 7.00 <= pr(p) <= 8.50,
     [('4 oz', 7.99), ('8 oz', 12.99)]),

    # ── Three Dog Bakery Lick'n Crunch sandwich cookies ──────────────────
    (lambda p: 'three dog bakery' in bl(p) and ('lick' in nl(p) or 'crunch' in nl(p)),
     [('13 oz', 4.99), ('26 oz', 7.99)]),

    # ── Three Dog Bakery Woofers / Peanut Mutter Bites ───────────────────
    (lambda p: 'three dog bakery' in bl(p) and ('woofer' in nl(p) or 'mutter' in nl(p)),
     [('13 oz', 5.99), ('26 oz', 9.99)]),

    # ── Hartz Delectables Squeeze Up tubes ($2.58–$2.59 = 4ct) ───────────
    (lambda p: 'hartz delectables' in bl(p) and 'squeeze' in nl(p) and pr(p) <= 3.00,
     [('4 Count', 2.59), ('16 Count', 9.49)]),

    # ── Hartz Delectables Squeeze Up variety/larger ($6+) ─────────────────
    (lambda p: 'hartz delectables' in bl(p) and 'squeeze' in nl(p) and pr(p) >= 6.00,
     [('4 Count', 2.59), ('16 Count', 6.22), ('32 Count', 12.99)]),

    # ── Friskies Lil' Shakes / Lil' Gravies single pouches ($1.19–$1.39) ──
    (lambda p: 'friskies' in bl(p) and ("lil'" in nl(p) or 'lil ' in nl(p))
               and ('shake' in nl(p) or 'gravy' in nl(p) or 'gravies' in nl(p))
               and pr(p) <= 1.60,
     [('1 Count', 1.39), ('12 Count', 12.99)]),

    # ── Friskies Playfuls Crunchy cat treats ($1.78 = 2.1 oz) ─────────────
    (lambda p: 'friskies' in bl(p) and 'playful' in nl(p) and pr(p) <= 2.00,
     [('2.1 oz', 1.78), ('6 oz', 5.79)]),

    # ── Friskies Lil' Lickables Puree ($2.99 = 4ct) ──────────────────────
    (lambda p: 'friskies' in bl(p) and 'lickable' in nl(p) and pr(p) <= 3.50,
     [('4 Count', 2.99), ('20 Count', 11.99)]),

    # ── Friskies Party Mix medium/large bags ($3.99–$14.18) ──────────────
    (lambda p: 'friskies' in bl(p) and 'party mix' in nl(p) and pr(p) >= 3.00,
     [('2.1 oz', 1.79), ('6 oz', 3.99), ('20 oz', 10.99), ('30 oz', 14.18)]),

    # ── Temptations Classic at $3.99 (no specific size in name) ──────────
    (lambda p: 'temptations' in bl(p) and 3.90 <= pr(p) <= 4.10
               and 'oz' not in nl(p) and 'snowman' not in nl(p) and 'spoon' not in nl(p),
     [('3 oz', 2.59), ('6.3 oz', 3.99), ('16 oz', 7.99)]),

    # ── Temptations Lickable Spoons ($2.99 = 1.4oz) ──────────────────────
    (lambda p: 'temptations' in bl(p) and 'spoon' in nl(p),
     [('1.4 oz (1 ct)', 2.99), ('5.6 oz (4 ct)', 9.49)]),

    # ── Greenies dog dental bags ($17.99 = 11.3 oz) ──────────────────────
    (lambda p: 'greenies' in bl(p) and pr(p) >= 16.00
               and ('petite' in nl(p) or 'regular' in nl(p) or 'large' in nl(p) or 'teenie' in nl(p))
               and 'cat' not in nl(p),
     [('6 oz', 9.99), ('11.3 oz', 17.99), ('27 oz', 33.99)]),

    # ── Greenies Pill Pockets ─────────────────────────────────────────────
    (lambda p: 'greenies' in bl(p) and 'pill pocket' in nl(p),
     [('7.9 oz (30 ct)', 10.99), ('Multipack', 17.98)]),

    # ── Whimzees multi-count bags (Small/Large ~$15.89) ───────────────────
    (lambda p: 'whimzees' in bl(p) and pr(p) >= 14.00 and 'cat' not in nl(p),
     [('Small (14 ct)', 15.89), ('Medium (12 ct)', 17.99), ('Large (10 ct)', 20.99)]),

    # ── Bonkers Crunchy cat treats ($1.99 = 2.1oz bag) ───────────────────
    (lambda p: 'bonkers' in bl(p) and 'crunchy' in nl(p) and pr(p) <= 2.50,
     [('2.1 oz', 1.99), ('6 oz', 3.99), ('10 oz', 6.99)]),

    # ── Bonkers Crunchy larger bags ($3.99) ──────────────────────────────
    (lambda p: 'bonkers' in bl(p) and 'crunchy' in nl(p) and 3.50 <= pr(p) <= 4.50,
     [('2.1 oz', 1.99), ('6 oz', 3.99), ('10 oz', 6.99)]),

    # ── Bonkers Mixx lickable ($1.99 = 4ct) ──────────────────────────────
    (lambda p: 'bonkers' in bl(p) and 'mixx' in nl(p),
     [('4 Count', 1.99), ('8 Count', 3.99)]),

    # ── Fancy Feast Classic Broths single pouches ($1.33 = 1.4oz) ────────
    (lambda p: 'fancy feast' in bl(p) and 'broth' in nl(p) and pr(p) <= 1.60,
     [('1 Count', 1.33), ('12 Count', 14.99)]),

    # ── Fancy Feast Savory Puree Naturals ($2.59 = 1 tube) ────────────────
    (lambda p: 'fancy feast' in bl(p) and 'puree' in nl(p) and pr(p) <= 3.00,
     [('1 Count', 2.59), ('6 Count', 12.99)]),

    # ── Blue Buffalo Wilderness cat treats ($2.99 = 2oz) ─────────────────
    (lambda p: 'blue buffalo' in bl(p) and 'wilderness' in nl(p) and 'cat' in nl(p) and pr(p) <= 3.50,
     [('2 oz', 2.99), ('5 oz', 5.99)]),

    # ── Blue Buffalo True Chews cat treats ($4.99) ────────────────────────
    (lambda p: 'blue buffalo' in bl(p) and 'true chews' in nl(p) and 'cat' in nl(p),
     [('2 oz', 4.99), ('5 oz', 8.99)]),

    # ── Blue Buffalo Baby BLUE puppy treats ($4.99) ───────────────────────
    (lambda p: 'blue buffalo' in bl(p) and 'baby blue' in nl(p).replace('™',''),
     [('4 oz', 4.99), ('8 oz', 8.99)]),

    # ── Churu Senior cat treats ($4.99 = 2oz / 4ct) ──────────────────────
    (lambda p: bl(p) == 'churu' and 'senior' in nl(p) and pr(p) <= 6.00,
     [('2 oz (4 ct)', 4.99), ('5 oz (10 ct)', 9.99)]),

    # ── KONG Easy Treat paste ($6.99) ────────────────────────────────────
    (lambda p: 'kong' in bl(p) and ('easy treat' in nl(p) or 'paste' in nl(p)),
     [('8 oz', 6.99), ('13 oz', 10.99)]),

    # ── Inaba Churu multipacks ($2.29–$4.99) ─────────────────────────────
    (lambda p: bl(p) == 'inaba' and 2.00 <= pr(p) <= 5.50 and 'churu' in nl(p),
     [('2 oz (4 ct)', 2.29), ('5 oz (10 ct)', 4.99), ('25 oz (50 ct)', 14.99)]),

    # ── Tiki Cat Broths / Stix wet treats ────────────────────────────────
    (lambda p: 'tiki cat' in bl(p) and pr(p) <= 4.50,
     [('1 Count', 3.59), ('12 Count', 19.79)]),
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
            if not any(c in cn for c in TREAT_CATS): continue
            if len(p.get('variants', [])) > 1: continue
            results.append(p)
        return results
    except Exception as e:
        print(f'  page {page} error: {e}')
        return []

def get_all_treats():
    from concurrent.futures import ThreadPoolExecutor, as_completed
    treats = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(fetch_page, pg): pg for pg in range(1, 102)}
        for fut in as_completed(futures):
            treats.extend(fut.result())
    return treats

def update_product(pid, product, new_variants, token):
    # Strip _id from each variant (causes issues with Mongo ObjectId serialization)
    clean_variants = []
    for v in new_variants:
        cv = {k: val for k, val in v.items() if k != '_id'}
        clean_variants.append(cv)

    payload = {
        'variants': clean_variants,
        'basePrice': clean_variants[0]['price'],
        'petsmartSynced': True
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f'{API}/products/{pid}',
        data=data,
        headers={**HEADERS, 'Authorization': f'Bearer {token}'},
        method='PUT'
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200
    except Exception as e:
        print(f'  PUT error {pid}: {e}')
        return False

def main():
    print('Logging in...')
    token = login()
    print('OK\n')

    print('Fetching single-variant treat products...')
    treats = get_all_treats()
    print(f'Found {len(treats)} single-variant treat products\n')

    matched = []
    skipped = []
    for p in treats:
        variants = match_rule(p)
        if variants:
            matched.append((p, variants))
        else:
            skipped.append(p)

    print(f'Matched: {len(matched)} | Skipped (no rule): {len(skipped)}\n')

    # Show preview of skipped brands
    skip_brands = {}
    for p in skipped:
        b = p.get('brand') or 'Unknown'
        skip_brands[b] = skip_brands.get(b, 0) + 1
    top_skip = sorted(skip_brands.items(), key=lambda x: -x[1])[:15]
    print('Top skipped brands:')
    for br, cnt in top_skip:
        print(f'  {cnt:3d}  {br}')
    print()

    # Run updates in parallel batches of 6
    from concurrent.futures import ThreadPoolExecutor, as_completed
    updated = 0
    errors = 0
    done = 0

    def do_update(args):
        p, variants = args
        return p['_id'], update_product(p['_id'], p, variants, token)

    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(do_update, item): item for item in matched}
        for fut in as_completed(futures):
            pid, ok = fut.result()
            done += 1
            if ok:
                updated += 1
            else:
                errors += 1
            if done % 20 == 0 or done == len(matched):
                print(f'  [{done}/{len(matched)}] updated={updated} errors={errors}')

    print(f'\nDone. Updated: {updated} | Errors: {errors} | Skipped: {len(skipped)}')

if __name__ == '__main__':
    main()

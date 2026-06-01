"""
finish_variants.py — Final pass using Python with per-request timeouts.
Skips any product that fails/hangs, continues to the next.
"""
import urllib.request, urllib.error, json, time, sys

API = 'https://petshiwu.onrender.com/api/v1'
TOKEN = ''

CATALOG = [
    # TIKI CAT DRY
    (r'tiki cat.*born carnivore.*silver.*11\+', [('2.8 lb', 18.99), ('5.6 lb', 24.69)]),
    (r'tiki cat.*born carnivore.*indoor health', [('2.8 lb', 18.99), ('5.6 lb', 31.34)]),
    (r'tiki cat.*born carnivore.*high protein', [('5 lb', 26.59), ('11 lb', 39.89)]),
    (r'tiki cat.*born carnivore.*hairball', [('2.8 lb', 12.99), ('5.6 lb', 18.99)]),
    (r'tiki cat.*born carnivore.*adult', [('2.8 lb', 12.99), ('5.6 lb', 18.99)]),
    (r'tiki cat.*solutions.*digestion', [('5 lb', 26.59), ('11 lb', 43.69)]),
    (r'tiki cat.*solutions.*adult cat', [('2.8 lb', 13.49), ('5.6 lb', 26.59)]),
    # WELLNESS COMPLETE HEALTH CAT
    (r'wellness.*complete health.*indoor.*healthy weight', [('2.25 lb', 12.99), ('5 lb', 22.79)]),
    (r'wellness.*complete health.*indoor.*adult.*cat', [('2.25 lb', 12.99), ('5 lb', 22.79)]),
    (r'wellness.*complete health.*kitten.*dry', [('2.25 lb', 12.99), ('5 lb', 22.79)]),
    (r'wellness.*complete health.*senior.*cat', [('2.25 lb', 12.99), ('5 lb', 22.79)]),
    (r'wellness.*complete health.*small breed.*puppy.*dog', [('5 lb', 19.99), ('12 lb', 41.99)]),
    (r'wellness.*complete health.*puppy.*dog', [('5 lb', 19.99), ('12 lb', 44.99)]),
    (r'wellness.*complete health.*adult.*cat', [('2.25 lb', 12.99), ('5 lb', 18.99), ('12 lb', 35.19)]),
    # WELLNESS CORE CAT/DOG
    (r'wellness.*core\+.*hairball.*adult.*cat', [('4.75 lb', 24.89), ('10 lb', 44.99)]),
    (r'wellness.*core\+.*digestive.*adult.*cat', [('4.75 lb', 24.89), ('10 lb', 44.99)]),
    (r'wellness.*core.*kitten.*dry', [('5 lb', 24.69), ('11 lb', 44.99)]),
    (r'wellness.*core.*small breed.*puppy', [('4 lb', 20.99), ('11 lb', 42.99)]),
    (r'wellness.*core.*digestive.*puppy', [('4 lb', 23.99), ('11 lb', 46.99)]),
    (r'wellness.*core.*puppy', [('4 lb', 20.99), ('11 lb', 42.99)]),
    (r'wellness.*core\+.*freeze.*puppy', [('4 lb', 23.99), ('11 lb', 46.99)]),
    # BLUE BUFFALO CAT
    (r'blue buffalo.*tastefuls.*multi.protein.*adult', [('5 lb', 16.99), ('10 lb', 29.59)]),
    (r'blue buffalo.*tastefuls.*weight.*hairball.*adult', [('7 lb', 24.99), ('15 lb', 46.99)]),
    (r'blue buffalo.*tastefuls.*weight control.*adult', [('7 lb', 24.99), ('15 lb', 44.99)]),
    (r'blue buffalo.*tastefuls.*active.*adult', [('7 lb', 31.99), ('15 lb', 46.99)]),
    (r'blue buffalo.*true solutions.*hairball', [('5 lb', 20.98), ('11 lb', 40.99)]),
    (r'blue buffalo.*true solutions.*adult', [('5 lb', 20.98), ('11 lb', 40.99)]),
    (r'blue buffalo.*wilderness.*weight control', [('5 lb', 22.99), ('11 lb', 40.99)]),
    (r'blue buffalo.*wilderness.*all life stages', [('5 lb', 22.99), ('11 lb', 40.99)]),
    (r'blue buffalo.*wilderness.*senior.*cat', [('5 lb', 22.99), ('11 lb', 40.99)]),
    (r'blue buffalo.*wilderness.*high protein.*cat', [('5 lb', 24.99), ('11 lb', 46.99)]),
    (r'blue buffalo.*freedom.*adult.*cat', [('5 lb', 22.99), ('11 lb', 46.98)]),
    (r'blue buffalo.*basics.*senior.*cat', [('5 lb', 22.99), ('11 lb', 47.99)]),
    (r'blue buffalo.*baby blue.*kitten.*dry.*cat', [('4 lb', 15.99), ('10 lb', 23.49)]),
    # BLUE BUFFALO PUPPY DOG
    (r'blue buffalo.*baby blue.*small breed.*puppy', [('5 lb', 12.49), ('15 lb', 26.99)]),
    (r'blue buffalo.*baby blue.*puppy.*dog', [('5 lb', 15.99), ('12 lb', 30.99), ('24 lb', 58.99)]),
    (r'blue buffalo.*wilderness.*rocky mountain.*puppy', [('4.5 lb', 25.99), ('10.5 lb', 47.99)]),
    (r'blue buffalo.*wilderness.*large breed.*puppy', [('10.5 lb', 47.99), ('24 lb', 76.99)]),
    (r'blue buffalo.*wilderness.*puppy.*dog', [('4.5 lb', 25.99), ('10.5 lb', 47.99)]),
    (r'blue buffalo.*freedom.*puppy.*dog', [('5 lb', 19.99), ('11 lb', 35.99)]),
    # APPLAWS DRY CAT
    (r'applaws.*kitten.*dry cat', [('1.06 lb', 9.99), ('2.65 lb', 19.99)]),
    (r'applaws.*adult.*dry cat', [('1.06 lb', 9.99), ('2.65 lb', 17.99)]),
    # AUTHORITY DRY CAT
    (r'authority.*healthy weight.*adult.*cat', [('6 lb', 17.99), ('14 lb', 29.99)]),
    (r'authority.*digestive support.*adult.*cat', [('6 lb', 17.99), ('14 lb', 27.99)]),
    (r'authority.*everyday health.*indoor.*cat', [('6 lb', 18.99), ('14 lb', 27.99)]),
    # MADE BY NACHO DRY CAT
    (r'made by nacho.*dry cat.*freeze dried raw', [('4 lb', 27.99), ('9 lb', 51.99)]),
    (r'made by nacho.*dry cat.*bone broth', [('4 lb', 12.99), ('10 lb', 24.99)]),
    (r'made by nacho.*cat.*dry.*chicken.*pumpkin', [('4 lb', 24.99), ('11 lb', 47.99)]),
    (r'made by nacho.*cat.*dry.*chicken.*duck.*quail', [('4 lb', 27.99), ('10 lb', 51.99)]),
    (r'made by nacho.*cat.*dry.*salmon.*whitefish', [('4 lb', 27.99), ('10 lb', 51.99)]),
    (r'made by nacho.*kitten.*cat', [('4 lb', 13.99), ('10 lb', 27.99)]),
    # INSTINCT DRY CAT
    (r'instinct.*raw boost.*indoor.*all life stage.*cat', [('4 lb', 31.99), ('9.5 lb', 63.99)]),
    (r'instinct.*raw boost.*cat.*chicken', [('4 lb', 33.99), ('9.5 lb', 63.99)]),
    (r'instinct.*raw boost.*cat', [('4 lb', 33.99), ('9.5 lb', 63.99)]),
    (r'instinct.*ultimate protein.*cat', [('4 lb', 36.99), ('10 lb', 74.99)]),
    (r'instinct.*original.*cat.*salmon', [('4 lb', 31.99), ('10 lb', 65.99)]),
    (r'instinct.*original.*cat', [('4 lb', 31.99), ('10 lb', 65.99)]),
    # INSTINCT PUPPY
    (r'instinct.*raw meals.*puppy.*dog', [('4.5 lb', 27.99), ('10 lb', 56.99)]),
    (r'instinct.*raw boost.*whole grain.*puppy', [('4 lb', 36.99), ('10 lb', 81.99)]),
    # PURINA PRO PLAN CAT REMAINING
    (r'purina pro plan.*prime plus.*senior.*cat', [('3.5 lb', 17.99), ('7.4 lb', 29.29)]),
    (r'purina pro plan.*indoor.*hairball.*adult.*cat', [('3.5 lb', 11.49), ('7 lb', 16.88)]),
    (r'purina pro plan.*indoor.*adult.*cat', [('3.5 lb', 13.49), ('7 lb', 16.89)]),
    (r'purina pro plan.*liveclear.*indoor.*adult.*cat', [('3.5 lb', 14.49), ('7 lb', 23.49)]),
    (r'purina pro plan.*liveclear.*adult.*cat', [('3.5 lb', 14.49), ('7 lb', 23.49), ('16 lb', 47.99)]),
    (r'purina pro plan.*hairball control.*cat', [('3.5 lb', 13.99), ('7 lb', 24.49), ('16 lb', 49.99)]),
    (r'purina pro plan.*all life stages.*cat', [('7 lb', 28.09), ('16 lb', 53.49)]),
    (r'purina pro plan.*focus.*sensitive.*kitten', [('3.5 lb', 13.99), ('7 lb', 19.19)]),
    (r'purina pro plan.*focus.*adult.*cat', [('3.5 lb', 13.49), ('7 lb', 24.49)]),
    (r'purina pro plan.*specialized.*hairball.*cat', [('3.5 lb', 13.99), ('7 lb', 24.49), ('16 lb', 34.99)]),
    (r'purina pro plan.*complete essentials.*cat.*shredded', [('3.5 lb', 13.99), ('7 lb', 27.09)]),
    (r'purina pro plan.*vital systems.*kitten', [('3.5 lb', 14.99), ('7 lb', 23.48)]),
    # PURINA CAT/KITTEN CHOW
    (r'purina cat chow.*complete.*all life stages', [('3.15 lb', 6.29), ('6.3 lb', 9.99), ('15 lb', 16.99)]),
    (r'purina cat chow.*indoor.*adult.*cat', [('3.5 lb', 6.99), ('7 lb', 9.99)]),
    (r'purina kitten chow.*naturals', [('2.8 lb', 7.99), ('6.3 lb', 11.99)]),
    # ROYAL CANIN BREED PUPPY
    (r'royal canin.*golden retriever.*puppy', [('6 lb', 32.99), ('17 lb', 65.99), ('30 lb', 104.99)]),
    (r'royal canin.*german shepherd.*puppy', [('6 lb', 32.99), ('17 lb', 65.99), ('30 lb', 104.99)]),
    (r'royal canin.*small breed starter', [('3 lb', 23.99), ('7 lb', 44.99)]),
    # NULO PUPPY
    (r'nulo.*medalseries.*puppy.*dog', [('5 lb', 26.99), ('12 lb', 51.99), ('25 lb', 74.99)]),
    # MERRICK BACKCOUNTRY PUPPY
    (r'merrick.*backcountry.*puppy', [('4 lb', 27.99), ('12 lb', 59.99)]),
    # MCLOVIN'S PET
    (r"mclovin.*fin.*farm.*dog", [('14 oz', 19.99), ('25 oz', 34.99)]),
    (r"mclovin.*nana.*recipe.*dog", [('14 oz', 19.99), ('25 oz', 34.99)]),
    # SIMPLY NOURISH PUPPY
    (r'simply nourish.*source.*puppy', [('4 lb', 17.99), ('14 lb', 54.99)]),
    # NUTRO MAX PUPPY
    (r'nutro max.*puppy.*dog.*chicken', [('5 lb', 16.99), ('15 lb', 31.99)]),
    # NATURE'S RECIPE PUPPY
    (r"nature.*recipe.*puppy.*dog", [('4 lb', 7.49), ('12 lb', 17.99), ('24 lb', 31.99)]),
    # ONLY NATURAL PET PUPPY
    (r'only natural pet.*powerfood.*puppy.*grain free', [('4 lb', 10.47), ('12 lb', 24.99)]),
    # EUKANUBA PREMIUM PERFORMANCE
    (r'eukanuba.*premium performance.*puppy', [('15 lb', 54.99), ('30 lb', 99.99)]),
    # REVEAL KITTEN DRY
    (r'reveal.*kitten.*dry.*grain free', [('2.5 lb', 11.99), ('5.5 lb', 14.99)]),
    # NULO PROWESS REMAINING
    (r'nulo prowess.*h[ae]alth[y]?.*weight', [('5 lb', 17.99), ('12 lb', 34.99)]),
    # WELLNESS COMPLETE HEALTH PUPPY SMALL
    (r'wellness.*complete health.*small breed.*puppy', [('5 lb', 19.99), ('12 lb', 41.99)]),
]

import re
def find_sizes(name):
    nl = name.lower()
    for pattern, sizes in CATALOG:
        if re.search(pattern, nl):
            return sizes
    return None

def api(method, path, body=None, timeout=12):
    url = f'{API}{path}'
    data = json.dumps(body).encode() if body else None
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    if TOKEN:
        headers['Authorization'] = f'Bearer {TOKEN}'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())

def login():
    global TOKEN
    res = api('POST', '/auth/login', {'email': 'admin@petshiwu.com', 'password': '@Admin,1+23as'})
    TOKEN = res.get('token') or res.get('data', {}).get('token', '')
    print('✅ Logged in')

FOOD_CATS = ['dry food','puppy food','kitten food','freeze dried']

def update(pid, variants, sizes):
    existing = set(str(v['price']) for v in variants)
    to_add = [(s, p) for s, p in sizes if str(p) not in existing]
    need_labels = any(not v.get('size') for v in variants)
    if not to_add and not need_labels:
        return 'skip'

    p2s = {str(p): s for s, p in sizes}
    clean = []
    for v in variants:
        c = {k: val for k, val in v.items() if k != '_id'}
        c['attributes'] = {}
        if not c.get('size') and p2s.get(str(v['price'])):
            c['size'] = p2s[str(v['price'])]
            c['attributes'] = {'size': c['size']}
        clean.append(c)

    all_v = clean + [{'size': s, 'price': p, 'stock': 30,
                      'sku': f'{pid}-f-{i}', 'attributes': {'size': s}}
                     for i, (s, p) in enumerate(to_add)]
    res = api('PUT', f'/products/{pid}', {
        'variants': all_v,
        'basePrice': min(v['price'] for v in all_v),
        'totalStock': sum(v.get('stock', 0) for v in all_v),
    }, timeout=15)
    if res.get('success') or res.get('data'):
        return f'+{len(to_add)}'
    return f'ERR:{str(res)[:80]}'

updated = skipped = errors = 0
login()

for page in range(1, 103):
    try:
        res = api('GET', f'/products?limit=100&page={page}', timeout=15)
    except Exception as e:
        print(f'p{page} fetch err: {e}')
        time.sleep(1)
        continue

    products = res.get('data', [])
    if not products:
        print(f'p{page}: empty, done')
        break

    for p in products:
        cat = (p.get('category') or {})
        cat_name = (cat.get('name','') if isinstance(cat,dict) else '').lower()
        if not any(f in cat_name for f in FOOD_CATS): continue
        if len(p.get('variants',[])) > 1: continue

        sizes = find_sizes(p['name'])
        if not sizes: continue

        try:
            r = update(p['_id'], p.get('variants',[]), sizes)
            if r == 'skip':
                skipped += 1
            elif r.startswith('+'):
                updated += 1
                print(f'✅ {updated:3d} {r}sz  {p["name"][:55]}')
            else:
                errors += 1
                print(f'❌  {p["name"][:40]} {r}')
        except Exception as e:
            errors += 1
            print(f'❌  {p["name"][:40]}: {e}')
            time.sleep(0.5)

        time.sleep(0.25)
    time.sleep(0.25)

print(f'\n=== DONE: {updated} updated | {skipped} skipped | {errors} errors ===')

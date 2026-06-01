#!/usr/bin/env python3
"""
Scan all products, find descriptions with HTML entities, decode and update.
Runs full scan via /products/:id endpoint since list endpoint omits descriptions.
"""

import urllib.request, json, html, re, time, random, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

def log(msg):
    print(msg, flush=True)
    sys.stdout.flush()

API = 'https://petshiwu.onrender.com/api/v1'
HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json'}
ADMIN_EMAIL = 'admin@petshiwu.com'
ADMIN_PASS  = '@Admin,1+23as'

ENTITY_RE = re.compile(r'&(?:#\d+|#x[\da-fA-F]+|amp|lt|gt|quot|apos|nbsp);')

def login():
    data = json.dumps({'email': ADMIN_EMAIL, 'password': ADMIN_PASS}).encode()
    req = urllib.request.Request(f'{API}/auth/login', data=data, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['token']

def decode(text):
    """Decode HTML entities until stable (handles double/triple encoding)."""
    if not text: return text
    prev = None
    while prev != text:
        prev = text
        text = html.unescape(text)
    return text

def get_all_ids():
    """Fetch all product IDs from the list endpoint (fast, no descriptions)."""
    ids = []
    def fetch_page(pg):
        req = urllib.request.Request(
            f'{API}/products?limit=100&page={pg}',
            headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as r:
            d = json.loads(r.read())
        return [p['_id'] for p in d.get('data', [])]

    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(fetch_page, pg): pg for pg in range(1, 102)}
        for f in as_completed(futs):
            try:
                ids.extend(f.result())
            except Exception as e:
                pass
    return ids

def check_and_fix(pid, token):
    """Fetch product, check description, update if needed. Returns (pid, action)."""
    try:
        req = urllib.request.Request(
            f'{API}/products/{pid}',
            headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as r:
            pd = json.loads(r.read())
        p = pd.get('data', pd)

        desc = p.get('description', '') or ''
        short_desc = p.get('shortDescription', '') or ''

        desc_needs_fix = bool(ENTITY_RE.search(desc))
        short_needs_fix = bool(ENTITY_RE.search(short_desc))

        if not desc_needs_fix and not short_needs_fix:
            return pid, 'clean'

        payload = {}
        if desc_needs_fix:
            payload['description'] = decode(desc)
        if short_needs_fix:
            payload['shortDescription'] = decode(short_desc)

        data = json.dumps(payload).encode()
        req2 = urllib.request.Request(
            f'{API}/products/{pid}',
            data=data,
            headers={**HEADERS, 'Authorization': f'Bearer {token}'},
            method='PUT')
        with urllib.request.urlopen(req2, timeout=15) as r:
            if r.status == 200:
                return pid, 'fixed'
            return pid, 'error'
    except Exception as e:
        return pid, f'error:{e}'

def process_page(pg, token):
    """Fetch a page of IDs, check each product, fix if needed. Returns (fixed, clean, errors)."""
    try:
        req = urllib.request.Request(
            f'{API}/products?limit=100&page={pg}',
            headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as r:
            d = json.loads(r.read())
        ids = [p['_id'] for p in d.get('data', [])]
    except Exception as e:
        return 0, 0, 1

    fixed = clean = errors = 0
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(check_and_fix, pid, token): pid for pid in ids}
        for f in as_completed(futs):
            try:
                pid, action = f.result()
                if action == 'fixed':   fixed  += 1
                elif action == 'clean': clean  += 1
                else:                   errors += 1
            except:
                errors += 1
    return fixed, clean, errors


def main():
    log('Logging in...')
    token = login()
    log('OK\n')

    total_fixed = total_clean = total_errors = 0
    start = time.time()
    total_pages = 101

    for pg in range(1, total_pages + 1):
        f, c, e = process_page(pg, token)
        total_fixed  += f
        total_clean  += c
        total_errors += e
        done = pg * 100
        if pg % 5 == 0 or pg == total_pages:
            elapsed = time.time() - start
            rate = done / elapsed if elapsed > 0 else 0
            log(f'[page {pg}/{total_pages}] fixed={total_fixed} clean={total_clean} errors={total_errors} | {rate:.1f}/s')

    elapsed = time.time() - start
    log(f'\nDone in {elapsed/60:.1f} minutes.')
    log(f'Fixed: {total_fixed} | Clean: {total_clean} | Errors: {total_errors}')

if __name__ == '__main__':
    main()

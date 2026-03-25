#!/usr/bin/env python3
import csv
import json
import re
import requests
import concurrent.futures
import time
import sys

BAD_PHONE_PATTERNS = [
    r'^xxx',
    r'^-\d+$',
    r'^0+$',
    r'^\d{1,6}$',
]

def is_bad_phone(phone):
    if not phone or not phone.strip():
        return True
    p = phone.strip()
    if 'xxx' in p.lower():
        return True
    if p.startswith('-'):
        return True
    digits = re.sub(r'[^\d]', '', p)
    if len(digits) < 7:
        return True
    if re.match(r'^(\d)\1+$', digits):
        return True
    if digits in ['1234567890', '0123456789', '8888888888', '1111111111']:
        return True
    return False

def is_bad_linkedin(url):
    if not url or not url.strip():
        return True
    u = url.strip().lower()
    if u == 'url' or u == 'n/a' or u == '-':
        return True
    if 'linkedin.com' not in u:
        return True
    return False

def check_website(url, timeout=10):
    if not url or not url.strip():
        return False, ""
    url = url.strip()
    if not url.startswith('http'):
        url = 'https://' + url
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        resp = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code < 400:
            return True, url
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        return resp.status_code < 400, url
    except:
        if 'http://' in url:
            try:
                alt = url.replace('http://', 'https://')
                resp = requests.head(alt, headers=headers, timeout=timeout, allow_redirects=True)
                if resp.status_code < 400:
                    return True, alt
            except:
                pass
        return False, url

def classify_territory(city, state, territory):
    t = (territory or '').strip()
    if t == 'International':
        return 'International'
    if t == 'Canada':
        return 'Canada'
    if t in ['West', 'Northeast', 'Southeast', 'Midwest', 'Rocky Mountain', 'Central']:
        return 'Domestic'
    s = (state or '').strip().upper()
    if s in ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL']:
        return 'Canada'
    intl_indicators = ['XX', 'MH', 'VIC', 'NSW', 'QLD', 'DK', 'HE', 'IDF',
                       'Lombardy', 'Maharashtra', 'Sindh', 'Metro Manila',
                       'Singapore', 'EG', 'SP', 'DKI Jakarta', 'GA']
    if s in [x.upper() for x in intl_indicators]:
        return 'International'
    if not s and not city:
        return 'International'
    return 'Domestic'

def process_lapsed_csv(filepath):
    records = []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            company = (row.get('Company', '') or '').strip()
            if not company:
                continue
            city = (row.get('City', '') or '').strip()
            state = (row.get('State', '') or '').strip()
            territory = (row.get('Territory', '') or '').strip()
            phone = (row.get('Phone', '') or '').strip()
            website = (row.get('Website', '') or '').strip()
            linkedin = (row.get('LinkedIn', '') or '').strip()
            natoli_fit = (row.get('Natoli Fit', '') or '').strip()

            if is_bad_phone(phone):
                phone = ''
            if is_bad_linkedin(linkedin):
                linkedin = ''

            region = classify_territory(city, state, territory)

            records.append({
                'company': company,
                'city': city if city and city != 'City' else '',
                'state': state if state and state != 'XX' else '',
                'territory': territory,
                'phone': phone,
                'website': website,
                'linkedin': linkedin,
                'natoliFit': natoli_fit,
                'region': region,
            })
    return records

def validate_websites_batch(records, max_workers=20):
    print(f"Validating {len(records)} websites...")
    results = {}

    def check_one(idx):
        r = records[idx]
        ok, url = check_website(r['website'])
        return idx, ok, url

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(check_one, i): i for i in range(len(records))}
        done = 0
        for future in concurrent.futures.as_completed(futures):
            idx, ok, url = future.result()
            results[idx] = (ok, url)
            done += 1
            if done % 50 == 0:
                print(f"  Checked {done}/{len(records)}...")

    good_records = []
    bad_count = 0
    for i, r in enumerate(records):
        ok, url = results.get(i, (False, ''))
        if ok:
            r['website'] = url
            good_records.append(r)
        else:
            bad_count += 1

    print(f"Website validation: {len(good_records)} good, {bad_count} bad/unreachable")
    return good_records

def main():
    filepath = 'attached_assets/over_1_year_lapsed-customers_1771002670341.csv'
    print("Processing lapsed customers CSV...")
    records = process_lapsed_csv(filepath)
    print(f"Parsed {len(records)} records")

    phones_cleaned = sum(1 for r in records if not r['phone'])
    linkedin_cleaned = sum(1 for r in records if not r['linkedin'])
    print(f"Bad phones cleaned: {phones_cleaned}")
    print(f"Bad LinkedIn cleaned: {linkedin_cleaned}")

    seen = set()
    deduped = []
    for r in records:
        key = r['company'].lower().strip()
        key = re.sub(r'[^a-z0-9]', '', key)
        if key not in seen:
            seen.add(key)
            deduped.append(r)
    dupes = len(records) - len(deduped)
    print(f"Duplicates removed: {dupes}")
    records = deduped

    print("\nStarting website validation (this may take a few minutes)...")
    good_records = validate_websites_batch(records)

    domestic = [r for r in good_records if r['region'] == 'Domestic']
    international = [r for r in good_records if r['region'] == 'International']
    canada = [r for r in good_records if r['region'] == 'Canada']

    divisions = {}
    for r in good_records:
        d = r['natoliFit'] or 'Unknown'
        divisions[d] = divisions.get(d, 0) + 1

    territories = {}
    for r in good_records:
        t = r['territory'] or 'Unknown'
        territories[t] = territories.get(t, 0) + 1

    with_phone = sum(1 for r in good_records if r['phone'])
    with_linkedin = sum(1 for r in good_records if r['linkedin'])

    output = {
        'generated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'stats': {
            'total_raw': len(records) + dupes,
            'duplicates_removed': dupes,
            'bad_websites_removed': len(records) - len(good_records),
            'final_count': len(good_records),
            'domestic': len(domestic),
            'international': len(international),
            'canada': len(canada),
            'with_phone': with_phone,
            'with_linkedin': with_linkedin,
            'phone_coverage': round(with_phone / len(good_records) * 100) if good_records else 0,
        },
        'divisions': dict(sorted(divisions.items(), key=lambda x: -x[1])),
        'territories': dict(sorted(territories.items(), key=lambda x: -x[1])),
        'records': good_records,
    }

    outpath = 'TonyOS/static/natoli-clean-list/lapsed_customers.json'
    with open(outpath, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"\nWrote {len(good_records)} validated lapsed customers to {outpath}")
    print(f"Stats: {json.dumps(output['stats'], indent=2)}")

if __name__ == '__main__':
    main()

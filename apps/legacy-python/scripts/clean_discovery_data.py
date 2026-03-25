#!/usr/bin/env python3
import csv
import json
import re
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time
import concurrent.futures

NATOLI_VALID_INDUSTRIES = {
    "pharmaceutical tablet manufacturing", "generic drug tablet manufacturing",
    "nutraceutical tablet manufacturing", "dietary supplement tablets",
    "vitamin tablet manufacturing", "multivitamin tablet manufacturing",
    "confectionery tablet manufacturing", "veterinary tablet manufacturing",
    "cannabis tablet manufacturing", "cbd tablet manufacturing",
    "otc pain relief tablets", "otc tablet manufacturing",
    "cdmo tablet manufacturing", "503a compounding pharmacy",
    "503b outsourcing facility", "battery cathode manufacturing",
    "battery electrode manufacturing", "lithium ion battery materials",
    "solid state battery manufacturing", "sodium ion battery manufacturing",
    "nuclear fuel pellet manufacturing", "hydrogen storage materials",
    "catalyst pellet manufacturing", "carbon capture sorbent manufacturing",
    "advanced ceramics manufacturing", "bioceramics manufacturing",
    "structural ceramics aerospace", "piezoelectric ceramics",
    "3d printing feedstock manufacturing", "rare earth magnet manufacturing",
    "semiconductor materials", "superconductor materials",
    "space materials manufacturing", "thermal barrier coatings",
    "thermoelectric materials", "explosives propellant manufacturing",
    "ammunition manufacturing", "abrasives manufacturing",
    "medical implants manufacturing", "cosmetics pressed powder",
    "agricultural fertilizer tablets", "fertilizer tablet manufacturing",
    "animal feed supplements", "forensic standards laboratory",
    "recycled materials testing lab", "art conservation pigments lab",
    "powder metallurgy manufacturing", "sintered metal components",
    "tungsten carbide tooling", "carbon brush manufacturing",
    "diamond tool manufacturing", "ferrite manufacturing",
    "magnetic core manufacturing", "refractory metals pressing",
    "fuel cell electrode manufacturing", "brake pad powder compaction",
    "drug formulation r&d", "pharmaceutical formulation development",
    "pharmaceutical analytical development", "pharmaceutical continuous manufacturing",
    "manufacturing science and technology pharma",
    "compaction characterization laboratory", "excipient development laboratory",
    "dissolution testing laboratory", "bioavailability testing lab",
    "powder flow testing laboratory", "spray drying laboratory",
    "stability testing laboratory", "tablet scale up laboratory",
    "clinical trial manufacturing", "private label supplements",
    "probiotic tablet manufacturing", "herbal supplement tablets",
    "sports nutrition tablets", "protein supplement tablets",
    "collagen tablet manufacturing", "turmeric tablet manufacturing",
    "ashwagandha tablets", "fish oil tablet manufacturing",
    "melatonin tablet manufacturing", "iron supplement tablets",
    "calcium supplement tablets", "magnesium supplement tablets",
    "zinc supplement tablets", "immune booster tablets",
    "brain health tablets", "heart health tablets",
    "joint health tablets", "sleep aid tablet manufacturing",
    "weight loss supplement tablets", "energy supplement tablets",
    "beauty supplement tablets", "digestive enzyme tablets",
    "electrolyte tablets", "creatine tablets",
    "apple cider vinegar tablets", "detox supplement tablets",
    "keto supplement tablets", "testosterone booster tablets",
    "nootropic tablet manufacturing", "gummy vitamin alternatives",
    "chewable vitamin tablets", "allergy tablet manufacturing",
    "antacid tablet manufacturing", "store brand otc tablets",
    "pet vitamin supplements", "pet probiotic supplements",
    "pet joint health tablets", "pet calming tablets",
    "pet dental chew tablets", "pet flea tick tablets",
    "pool chlorine tablet manufacturing", "water treatment tablets",
    "dishwasher tablet manufacturing", "toilet bowl cleaner tablets",
    "drain cleaner tablets", "rust remover tablets",
    "concrete cleaner tablets", "septic system tablets",
    "pest control tablets", "plant food tablets",
}

NATOLI_COMPRESSION_KEYWORDS = [
    "tablet", "press", "compress", "compact", "pellet", "punch", "die",
    "tooling", "formulation", "dosage", "capsule", "powder", "granulation",
    "excipient", "solid dose", "oral solid", "rotary press", "single station",
]

TERRITORY_MAP = {
    "AL": "Southeast", "AK": "West Coast", "AZ": "Rocky Mountain", "AR": "Southeast",
    "CA": "West Coast", "CO": "Rocky Mountain", "CT": "Northeast", "DE": "Northeast",
    "FL": "Southeast", "GA": "Southeast", "HI": "West Coast", "ID": "Rocky Mountain",
    "IL": "Central", "IN": "Central", "IA": "Central", "KS": "Central",
    "KY": "Southeast", "LA": "Southeast", "ME": "Northeast", "MD": "Northeast",
    "MA": "Northeast", "MI": "Central", "MN": "Central", "MS": "Southeast",
    "MO": "Central", "MT": "Rocky Mountain", "NE": "Central", "NV": "Rocky Mountain",
    "NH": "Northeast", "NJ": "Northeast", "NM": "Rocky Mountain", "NY": "Northeast",
    "NC": "Southeast", "ND": "Central", "OH": "Central", "OK": "Central",
    "OR": "West Coast", "PA": "Northeast", "PR": "Southeast", "RI": "Northeast",
    "SC": "Southeast", "SD": "Central", "TN": "Southeast", "TX": "Central",
    "UT": "Rocky Mountain", "VT": "Northeast", "VA": "Southeast", "WA": "West Coast",
    "WV": "Southeast", "WI": "Central", "WY": "Rocky Mountain", "DC": "Northeast",
}

SALES_REP_MAP = {
    "Northeast": "Raffaele Romano",
    "Southeast": "Danny Ambrose",
    "Central": "David Nelson",
    "West Coast": "Fernando Delgado",
    "Rocky Mountain": "Eric Maughan",
    "International": "International Sales Team",
}

US_STATES = set(TERRITORY_MAP.keys())
INTL_INDICATORS = {"UK", "DK", "DE", "FR", "IN", "CN", "JP", "KR", "AU", "NZ",
                    "MX", "BR", "IT", "ES", "CH", "SE", "NO", "FI", "PL", "CZ",
                    "CA", "IE", "NL", "BE", "AT", "PT", "IL", "SG", "TW", "HK"}

def load_exclusion_list(path):
    exclusions = set()
    if not os.path.exists(path):
        return exclusions
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            company = line.strip().lower()
            if company and len(company) > 2:
                exclusions.add(company)
    return exclusions

def is_excluded(company_name, exclusion_set):
    name_lower = company_name.strip().lower()
    if name_lower in exclusion_set:
        return True
    for exc in exclusion_set:
        if len(exc) > 4 and (name_lower in exc or exc in name_lower):
            return True
    return False

def normalize_company_name(name):
    name = name.strip()
    name = re.sub(r'\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|,\s*Inc\.?|,\s*LLC|,\s*Ltd\.?|,\s*Corp\.?)\s*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def get_dedup_key(name):
    key = name.lower().strip()
    key = re.sub(r'[^a-z0-9\s]', '', key)
    key = re.sub(r'\b(inc|llc|ltd|corp|co|company|holdings|group|plc|ag|sa|nv|gmbh|pvt|private|limited)\b', '', key)
    key = re.sub(r'\s+', ' ', key).strip()
    return key

def fix_phone_number(phone_str, website_url=None, state=None):
    if not phone_str or phone_str.strip() in ('', '-', 'N/A', '#NAME?'):
        return ""
    phone_str = str(phone_str).strip()
    if phone_str.startswith('-') or phone_str.startswith('#'):
        return ""
    cleaned = re.sub(r'[^\d+]', '', phone_str)
    if len(cleaned) >= 10:
        if cleaned.startswith('1') and len(cleaned) == 11:
            return f"+1-{cleaned[1:4]}-{cleaned[4:7]}-{cleaned[7:]}"
        elif len(cleaned) == 10:
            return f"+1-{cleaned[0:3]}-{cleaned[3:6]}-{cleaned[6:]}"
        else:
            return phone_str
    return ""

def scrape_phone_from_website(url, timeout=8):
    if not url or url in ('N/A', '', '-'):
        return ""
    try:
        if not url.startswith('http'):
            url = 'https://' + url
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code != 200:
            contact_urls = [url.rstrip('/') + p for p in ['/contact', '/contact-us', '/about', '/about-us']]
            for cu in contact_urls:
                try:
                    resp = requests.get(cu, headers=headers, timeout=5, allow_redirects=True)
                    if resp.status_code == 200:
                        break
                except:
                    continue
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            text = soup.get_text()
            phone_patterns = [
                r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
                r'\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
                r'1[-.\s]?800[-.\s]?\d{3}[-.\s]?\d{4}',
                r'1[-.\s]?888[-.\s]?\d{3}[-.\s]?\d{4}',
                r'1[-.\s]?877[-.\s]?\d{3}[-.\s]?\d{4}',
                r'1[-.\s]?866[-.\s]?\d{3}[-.\s]?\d{4}',
            ]
            for pattern in phone_patterns:
                matches = re.findall(pattern, text)
                if matches:
                    phone = matches[0]
                    digits = re.sub(r'[^\d]', '', phone)
                    if len(digits) >= 10:
                        if digits.startswith('1') and len(digits) == 11:
                            return f"+1-{digits[1:4]}-{digits[4:7]}-{digits[7:]}"
                        elif len(digits) == 10:
                            return f"+1-{digits[0:3]}-{digits[3:6]}-{digits[6:]}"
            tel_links = soup.find_all('a', href=re.compile(r'^tel:'))
            for link in tel_links:
                href = link.get('href', '')
                digits = re.sub(r'[^\d]', '', href.replace('tel:', ''))
                if len(digits) >= 10:
                    if digits.startswith('1') and len(digits) == 11:
                        return f"+1-{digits[1:4]}-{digits[4:7]}-{digits[7:]}"
                    elif len(digits) == 10:
                        return f"+1-{digits[0:3]}-{digits[3:6]}-{digits[6:]}"
    except Exception as e:
        pass
    return ""

def validate_natoli_fit(industry, reason="", company=""):
    industry_lower = industry.lower().strip() if industry else ""
    if industry_lower in NATOLI_VALID_INDUSTRIES:
        return True
    for keyword in NATOLI_COMPRESSION_KEYWORDS:
        if keyword in industry_lower:
            return True
    reason_lower = (reason or "").lower()
    for keyword in NATOLI_COMPRESSION_KEYWORDS:
        if keyword in reason_lower:
            return True
    return False

def determine_territory(state, city="", country=""):
    state = (state or "").strip().upper()
    if state in US_STATES:
        return TERRITORY_MAP[state], "Domestic"
    if state in INTL_INDICATORS or len(state) > 2:
        return "International", "International"
    canadian_provinces = {"AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"}
    if state in canadian_provinces:
        return "Canada", "International"
    mexican_states = {"AGS", "BC", "BCS", "CAMP", "CHIS", "CHIH", "COAH", "COL", "CDMX", "DGO",
                       "GTO", "GRO", "HGO", "JAL", "MEX", "MICH", "MOR", "NAY", "NL", "OAX",
                       "PUE", "QRO", "QROO", "SLP", "SIN", "SON", "TAB", "TAMPS", "TLAX", "VER", "YUC", "ZAC"}
    if state in mexican_states:
        return "Mexico", "International"
    if state == "PR":
        return "Southeast", "Domestic (PR)"
    intl_cities = {"tokyo", "london", "beijing", "shenzhen", "ningde", "zürich", "zurich",
                    "düsseldorf", "dusseldorf", "brussels", "luxembourg", "erlangen",
                    "aalesund", "baar", "malvern", "atessa", "veldhoven", "hoganas",
                    "fornebu", "guildford", "slough", "copenhagen", "mumbai", "seoul",
                    "taipei", "singapore", "sydney", "melbourne", "paris", "berlin",
                    "munich", "frankfurt", "hamburg", "osaka", "yokohama", "nagoya"}
    city_lower = city.lower().strip() if city else ""
    if city_lower in intl_cities:
        return "International", "International"
    if state and state not in US_STATES and len(state) <= 3:
        return "International", "International"
    return "International", "International"

def determine_division(natoli_fit, industry="", reason=""):
    fit = (natoli_fit or "").strip()
    if fit in ("Engineering", "Scientific", "Both"):
        return fit
    industry_lower = (industry or "").lower()
    scientific_keywords = ["formulation", "r&d", "lab", "testing", "analytical", "development",
                            "bioavailability", "dissolution", "stability", "characterization",
                            "excipient", "clinical", "503a", "503b", "pharmaceutical formulation",
                            "spray drying", "powder flow"]
    engineering_keywords = ["tooling", "manufacturing", "press", "production", "battery", "nuclear",
                            "ceramics", "powder metallurgy", "ammunition", "abrasives", "carbide",
                            "ferrite", "magnet", "diamond", "sintered", "refractory", "brake pad",
                            "electrode", "catalyst", "carbon brush", "fuel cell"]
    is_sci = any(kw in industry_lower for kw in scientific_keywords)
    is_eng = any(kw in industry_lower for kw in engineering_keywords)
    if is_sci and is_eng:
        return "Both"
    if is_sci:
        return "Scientific"
    if is_eng:
        return "Engineering"
    return "Both"

def process_files():
    file1 = 'attached_assets/2222_1771000561296.csv'
    file2 = 'attached_assets/1111natoli_discovery_2026-02-13_(1)_1771000573455.csv'
    exclusion_path = 'TonyOS/static/exports/natoli_exclusion_list.txt'

    print("Loading exclusion list...")
    exclusion_set = load_exclusion_list(exclusion_path)
    print(f"  Loaded {len(exclusion_set)} exclusions")

    all_records = []
    for fpath, source in [(file1, "Discovery File 1"), (file2, "Discovery File 2")]:
        print(f"\nReading {fpath}...")
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['_source'] = source
                all_records.append(row)
    print(f"\nTotal raw records: {len(all_records)}")

    stats = {
        "total_raw": len(all_records),
        "duplicates_removed": 0,
        "excluded_removed": 0,
        "invalid_industry_removed": 0,
        "bad_phones_found": 0,
        "phones_scraped": 0,
        "final_count": 0,
        "domestic_count": 0,
        "international_count": 0,
    }

    seen_keys = {}
    deduped = []
    for rec in all_records:
        company = rec.get('Company', '').strip()
        if not company:
            continue
        key = get_dedup_key(company)
        if key in seen_keys:
            stats["duplicates_removed"] += 1
            existing = seen_keys[key]
            if rec.get('LinkedIn', '') and not existing.get('LinkedIn', ''):
                existing['LinkedIn'] = rec['LinkedIn']
            if rec.get('Website', '') and not existing.get('Website', ''):
                existing['Website'] = rec['Website']
            if rec.get('AI Summary', '') and not existing.get('AI Summary', ''):
                existing['AI Summary'] = rec['AI Summary']
            if rec.get('Competitors', '') and not existing.get('Competitors', ''):
                existing['Competitors'] = rec['Competitors']
            continue
        seen_keys[key] = rec
        deduped.append(rec)
    print(f"After dedup: {len(deduped)} (removed {stats['duplicates_removed']} duplicates)")

    non_excluded = []
    for rec in deduped:
        company = rec.get('Company', '').strip()
        if is_excluded(company, exclusion_set):
            stats["excluded_removed"] += 1
            continue
        non_excluded.append(rec)
    print(f"After exclusion check: {len(non_excluded)} (removed {stats['excluded_removed']} excluded)")

    validated = []
    for rec in non_excluded:
        industry = rec.get('Industry', '').strip()
        reason = rec.get('Reason', '').strip()
        company = rec.get('Company', '').strip()
        if validate_natoli_fit(industry, reason, company):
            validated.append(rec)
        else:
            stats["invalid_industry_removed"] += 1
    print(f"After Natoli validation: {len(validated)} (removed {stats['invalid_industry_removed']} non-Natoli-fit)")

    print("\nFixing phone numbers and scraping websites...")
    needs_scraping = []
    for rec in validated:
        phone = rec.get('Phone', '').strip()
        fixed = fix_phone_number(phone)
        if fixed:
            rec['Phone_Clean'] = fixed
        else:
            stats["bad_phones_found"] += 1
            rec['Phone_Clean'] = ""
            needs_scraping.append(rec)

    print(f"  {stats['bad_phones_found']} broken phones need scraping")
    scraped_count = 0
    batch_size = 50
    max_scrape = min(len(needs_scraping), 300)
    print(f"  Scraping up to {max_scrape} websites for phone numbers...")

    def scrape_one(rec):
        url = rec.get('Website', '')
        phone = scrape_phone_from_website(url, timeout=6)
        return (rec, phone)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for rec in needs_scraping[:max_scrape]:
            futures.append(executor.submit(scrape_one, rec))
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            try:
                rec, phone = future.result(timeout=15)
                if phone:
                    rec['Phone_Clean'] = phone
                    scraped_count += 1
            except:
                pass
            if (i+1) % 25 == 0:
                print(f"    Scraped {i+1}/{max_scrape}...")

    stats["phones_scraped"] = scraped_count
    print(f"  Successfully scraped {scraped_count} phone numbers")

    final_records = []
    for rec in validated:
        company = rec.get('Company', '').strip()
        state = rec.get('State', '').strip()
        city = rec.get('City', '').strip()
        territory_name, region_type = determine_territory(state, city)
        natoli_fit = rec.get('Natoli Fit', 'Both')
        industry = rec.get('Industry', '')
        reason = rec.get('Reason', '')
        division = determine_division(natoli_fit, industry, reason)
        sales_rep = rec.get('Sales Rep', '').strip()
        if not sales_rep:
            sales_rep = SALES_REP_MAP.get(territory_name, "Unassigned")
        territory_label = rec.get('Territory', '').strip()
        if not territory_label:
            territory_label = territory_name

        confidence = 0
        try:
            confidence = int(rec.get('Confidence', 0))
        except:
            pass

        website = rec.get('Website', '').strip()
        if website and not website.startswith('http'):
            website = 'https://' + website

        linkedin = rec.get('LinkedIn', '').strip()
        if linkedin and linkedin != 'N/A' and not linkedin.startswith('http'):
            linkedin = 'https://' + linkedin
        if linkedin == 'N/A':
            linkedin = ''

        clean_rec = {
            "company": normalize_company_name(company),
            "city": city,
            "state": state,
            "phone": rec.get('Phone_Clean', ''),
            "website": website,
            "linkedin": linkedin,
            "division": division,
            "territory": territory_label,
            "region": region_type,
            "salesRep": sales_rep,
            "industry": industry,
            "confidence": confidence,
            "reason": reason,
            "aiDecision": rec.get('AI Decision', '').strip(),
            "aiCompression": rec.get('AI Compression', '').strip(),
            "aiDivision": rec.get('AI Division', '').strip(),
            "aiConfidence": rec.get('AI Confidence', '').strip(),
            "pressureSignals": rec.get('Pressure Signals', '').strip(),
            "competitors": rec.get('Competitors', '').strip(),
            "aiSummary": rec.get('AI Summary', '').strip(),
            "gmpLikely": rec.get('GMP Likely', '').strip(),
            "fdaLikely": rec.get('FDA Likely', '').strip(),
            "source": rec.get('_source', ''),
        }

        if region_type == "International":
            stats["international_count"] += 1
        else:
            stats["domestic_count"] += 1

        final_records.append(clean_rec)

    final_records.sort(key=lambda x: (-x["confidence"], x["company"]))
    stats["final_count"] = len(final_records)

    industries_summary = {}
    for rec in final_records:
        ind = rec["industry"]
        if ind not in industries_summary:
            industries_summary[ind] = 0
        industries_summary[ind] += 1

    territories_summary = {}
    for rec in final_records:
        t = rec["territory"]
        if t not in territories_summary:
            territories_summary[t] = 0
        territories_summary[t] += 1

    divisions_summary = {"Engineering": 0, "Scientific": 0, "Both": 0}
    for rec in final_records:
        d = rec["division"]
        if d in divisions_summary:
            divisions_summary[d] += 1

    reps_summary = {}
    for rec in final_records:
        rep = rec["salesRep"]
        if rep not in reps_summary:
            reps_summary[rep] = 0
        reps_summary[rep] += 1

    output = {
        "generated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "stats": stats,
        "industries": dict(sorted(industries_summary.items(), key=lambda x: -x[1])),
        "territories": territories_summary,
        "divisions": divisions_summary,
        "salesReps": reps_summary,
        "records": final_records,
    }

    output_path = 'TonyOS/static/natoli-clean-list/data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n{'='*60}")
    print(f"PROCESSING COMPLETE")
    print(f"{'='*60}")
    print(f"Total raw records:        {stats['total_raw']}")
    print(f"Duplicates removed:       {stats['duplicates_removed']}")
    print(f"Excluded (existing):      {stats['excluded_removed']}")
    print(f"Invalid industry removed: {stats['invalid_industry_removed']}")
    print(f"Bad phones found:         {stats['bad_phones_found']}")
    print(f"Phones scraped from web:  {stats['phones_scraped']}")
    print(f"FINAL CLEAN RECORDS:      {stats['final_count']}")
    print(f"  Domestic:               {stats['domestic_count']}")
    print(f"  International:          {stats['international_count']}")
    print(f"Industries covered:       {len(industries_summary)}")
    print(f"Territories:              {len(territories_summary)}")
    print(f"\nOutput: {output_path}")

    csv_path = 'TonyOS/static/natoli-clean-list/natoli_clean_export.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        fields = ["company", "city", "state", "phone", "website", "linkedin",
                   "division", "territory", "region", "salesRep", "industry",
                   "confidence", "reason", "aiDecision", "aiCompression",
                   "aiDivision", "aiConfidence", "pressureSignals", "competitors",
                   "aiSummary", "gmpLikely", "fdaLikely"]
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        for rec in final_records:
            writer.writerow(rec)
    print(f"CSV Export: {csv_path}")

if __name__ == '__main__':
    process_files()

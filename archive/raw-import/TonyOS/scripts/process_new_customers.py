#!/usr/bin/env python3
import csv
import json
import re
import requests
from bs4 import BeautifulSoup
import time
import concurrent.futures

def parse_new_customers_csv(filepath):
    sale_customers = []
    no_sale_customers = []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        rows = list(reader)
    for row in rows[2:]:
        if len(row) > 1 and row[0].strip() and row[1].strip():
            sale_customers.append({'id': row[0].strip(), 'name': row[1].strip()})
        if len(row) > 5 and row[4].strip() and row[5].strip():
            no_sale_customers.append({'id': row[4].strip(), 'name': row[5].strip()})
    return sale_customers, no_sale_customers

def guess_website(company_name):
    clean = company_name.lower()
    clean = re.sub(r'\b(inc|llc|ltd|corp|co|company|holdings|group|plc|ag|sa|nv|gmbh|pvt|private|limited|s\.?r\.?l\.?|s\.?a\.?|sp\.?\s*z\.?\s*o\.?\s*o\.?|pty|sdn\s*bhd|mon\.?\s*i\.?k\.?e\.?)\b', '', clean)
    clean = re.sub(r'[^a-z0-9\s]', '', clean)
    clean = re.sub(r'\s+', '', clean).strip()
    if not clean:
        return ""
    return f"https://www.{clean}.com"

def scrape_company_info(company_name, guessed_url, timeout=8):
    result = {
        "website": "",
        "linkedin": "",
        "phone": "",
        "city": "",
        "state": "",
        "country": "",
        "industry": "",
        "description": "",
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    search_name = re.sub(r'\b(INC|LLC|LTD|CORP|CO|SA|SRL|GMBH|PVT|SDN BHD)\b', '', company_name, flags=re.IGNORECASE).strip()

    try:
        resp = requests.get(guessed_url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200 and len(resp.text) > 500:
            result["website"] = resp.url
            soup = BeautifulSoup(resp.text, 'html.parser')
            text = soup.get_text()

            phone_patterns = [
                r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
                r'\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}',
            ]
            for pattern in phone_patterns:
                matches = re.findall(pattern, text)
                if matches:
                    phone = matches[0]
                    digits = re.sub(r'[^\d]', '', phone)
                    if len(digits) >= 10:
                        if digits.startswith('1') and len(digits) == 11:
                            result["phone"] = f"+1-{digits[1:4]}-{digits[4:7]}-{digits[7:]}"
                        elif len(digits) == 10:
                            result["phone"] = f"+1-{digits[0:3]}-{digits[3:6]}-{digits[6:]}"
                        else:
                            result["phone"] = phone
                        break

            tel_links = soup.find_all('a', href=re.compile(r'^tel:'))
            if tel_links and not result["phone"]:
                href = tel_links[0].get('href', '')
                digits = re.sub(r'[^\d]', '', href.replace('tel:', ''))
                if len(digits) >= 10:
                    if digits.startswith('1') and len(digits) == 11:
                        result["phone"] = f"+1-{digits[1:4]}-{digits[4:7]}-{digits[7:]}"
                    elif len(digits) == 10:
                        result["phone"] = f"+1-{digits[0:3]}-{digits[3:6]}-{digits[6:]}"

            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                result["description"] = (meta_desc.get('content', '') or '')[:200]

            li_links = soup.find_all('a', href=re.compile(r'linkedin\.com'))
            if li_links:
                result["linkedin"] = li_links[0].get('href', '')

            address_el = soup.find('address')
            if address_el:
                addr_text = address_el.get_text()
                state_match = re.search(r'\b([A-Z]{2})\s+\d{5}', addr_text)
                if state_match:
                    result["state"] = state_match.group(1)

    except Exception:
        pass

    return result

def determine_region(company_name, state=""):
    intl_suffixes = ["gmbh", "s.r.l", "srl", "s.a.", "sa ", "sp. z o.o", "sdn bhd",
                      "pvt", "pty", "a/s", "ag ", "bv ", "anonim", "ltda",
                      "mon. i.k.e", "co., ltd", "limited iraq"]
    name_lower = company_name.lower()
    for suffix in intl_suffixes:
        if suffix in name_lower:
            return "International"

    intl_keywords = ["brazil", "colombia", "costa rica", "peru", "argentina", "mexico",
                      "pharma production gmbh", "ireland", "italy", "south africa",
                      "indonesia", "nigeria", "pakistan", "bangladesh", "turkey",
                      "algeria", "pharmaceutica ltda", "suzhou"]
    for kw in intl_keywords:
        if kw in name_lower:
            return "International"

    us_states = {"AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID",
                  "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS",
                  "MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
                  "OR","PA","PR","RI","SC","SD","TN","TX","UT","VT","VA","WA",
                  "WV","WI","WY","DC"}
    if state.upper() in us_states:
        return "Domestic"

    us_keywords = ["tampa", "texas", "missouri", "usa", "us llc", "pharmacy llc",
                    "pr llc"]
    for kw in us_keywords:
        if kw in name_lower:
            return "Domestic"

    return "Unknown"

def process_new_customers():
    filepath = 'attached_assets/NewCustomers_2025_and_2024_1771001845289.csv'
    print("Parsing new customers CSV...")
    sale_customers, no_sale_customers = parse_new_customers_csv(filepath)
    print(f"  Sale customers: {len(sale_customers)}")
    print(f"  No Sale customers: {len(no_sale_customers)}")

    all_customers = []
    for c in sale_customers:
        c['status'] = 'Ordered'
        all_customers.append(c)
    for c in no_sale_customers:
        c['status'] = 'No Order'
        all_customers.append(c)

    print(f"\nScraping company info for {len(all_customers)} companies...")

    def process_one(customer):
        name = customer['name']
        guessed = guess_website(name)
        info = scrape_company_info(name, guessed, timeout=6)
        region = determine_region(name, info.get('state', ''))
        return {
            "customerId": customer['id'],
            "company": name,
            "status": customer['status'],
            "website": info['website'],
            "linkedin": info['linkedin'],
            "phone": info['phone'],
            "city": info['city'],
            "state": info['state'],
            "region": region,
            "description": info['description'],
        }

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        futures = {executor.submit(process_one, c): c for c in all_customers}
        done_count = 0
        for future in concurrent.futures.as_completed(futures):
            done_count += 1
            try:
                result = future.result(timeout=15)
                results.append(result)
            except Exception as e:
                c = futures[future]
                results.append({
                    "customerId": c['id'],
                    "company": c['name'],
                    "status": c['status'],
                    "website": "",
                    "linkedin": "",
                    "phone": "",
                    "city": "",
                    "state": "",
                    "region": determine_region(c['name']),
                    "description": "",
                })
            if done_count % 25 == 0:
                print(f"  Processed {done_count}/{len(all_customers)}...")

    results.sort(key=lambda x: (0 if x['status'] == 'Ordered' else 1, x['company']))

    sale_results = [r for r in results if r['status'] == 'Ordered']
    no_sale_results = [r for r in results if r['status'] == 'No Order']

    has_website = sum(1 for r in results if r['website'])
    has_phone = sum(1 for r in results if r['phone'])
    has_linkedin = sum(1 for r in results if r['linkedin'])
    domestic = sum(1 for r in results if r['region'] == 'Domestic')
    international = sum(1 for r in results if r['region'] == 'International')

    output = {
        "generated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "stats": {
            "total": len(results),
            "ordered": len(sale_results),
            "noOrder": len(no_sale_results),
            "hasWebsite": has_website,
            "hasPhone": has_phone,
            "hasLinkedIn": has_linkedin,
            "domestic": domestic,
            "international": international,
        },
        "ordered": sale_results,
        "noOrder": no_sale_results,
    }

    output_path = 'TonyOS/static/natoli-clean-list/new_customers.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"NEW CUSTOMERS PROCESSING COMPLETE")
    print(f"{'='*60}")
    print(f"Total customers:     {len(results)}")
    print(f"  Ordered (Sale):    {len(sale_results)}")
    print(f"  No Order:          {len(no_sale_results)}")
    print(f"  Websites found:    {has_website}")
    print(f"  Phones found:      {has_phone}")
    print(f"  LinkedIn found:    {has_linkedin}")
    print(f"  Domestic:          {domestic}")
    print(f"  International:     {international}")
    print(f"\nOutput: {output_path}")

if __name__ == '__main__':
    process_new_customers()

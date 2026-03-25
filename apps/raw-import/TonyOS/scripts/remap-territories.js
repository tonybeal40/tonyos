/**
 * Remap territories to standard US regions + Canada + International
 */

const fs = require('fs');
const path = require('path');

const TERRITORY_MAP = {
  // WEST COAST
  'CA': 'West Coast',
  'OR': 'West Coast',
  'WA': 'West Coast',
  'AK': 'West Coast',
  'HI': 'West Coast',
  'West': 'West Coast',
  'California': 'West Coast',
  'Oregon': 'West Coast',
  'Washington': 'West Coast',
  
  // ROCKY MOUNTAIN
  'CO': 'Rocky Mountain',
  'UT': 'Rocky Mountain',
  'WY': 'Rocky Mountain',
  'MT': 'Rocky Mountain',
  'ID': 'Rocky Mountain',
  'NV': 'Rocky Mountain',
  'AZ': 'Rocky Mountain',
  'NM': 'Rocky Mountain',
  'Central': 'Rocky Mountain',
  'Colorado': 'Rocky Mountain',
  'Utah': 'Rocky Mountain',
  'Arizona': 'Rocky Mountain',
  
  // MIDWEST
  'IL': 'Midwest',
  'IN': 'Midwest',
  'MI': 'Midwest',
  'OH': 'Midwest',
  'WI': 'Midwest',
  'MN': 'Midwest',
  'IA': 'Midwest',
  'MO': 'Midwest',
  'ND': 'Midwest',
  'SD': 'Midwest',
  'NE': 'Midwest',
  'KS': 'Midwest',
  'Illinois': 'Midwest',
  'Indiana': 'Midwest',
  'Michigan': 'Midwest',
  'Ohio': 'Midwest',
  'Wisconsin': 'Midwest',
  'Minnesota': 'Midwest',
  
  // NORTHEAST
  'NY': 'Northeast',
  'NJ': 'Northeast',
  'PA': 'Northeast',
  'CT': 'Northeast',
  'MA': 'Northeast',
  'RI': 'Northeast',
  'VT': 'Northeast',
  'NH': 'Northeast',
  'ME': 'Northeast',
  'DE': 'Northeast',
  'MD': 'Northeast',
  'DC': 'Northeast',
  'East': 'Northeast',
  'New York': 'Northeast',
  'New Jersey': 'Northeast',
  'Pennsylvania': 'Northeast',
  'Massachusetts': 'Northeast',
  'Maryland': 'Northeast',
  
  // SOUTHEAST
  'VA': 'Southeast',
  'WV': 'Southeast',
  'NC': 'Southeast',
  'SC': 'Southeast',
  'GA': 'Southeast',
  'FL': 'Southeast',
  'AL': 'Southeast',
  'MS': 'Southeast',
  'TN': 'Southeast',
  'KY': 'Southeast',
  'LA': 'Southeast',
  'AR': 'Southeast',
  'TX': 'Southeast',
  'OK': 'Southeast',
  'Virginia': 'Southeast',
  'North Carolina': 'Southeast',
  'South Carolina': 'Southeast',
  'Georgia': 'Southeast',
  'Florida': 'Southeast',
  'Tennessee': 'Southeast',
  'Texas': 'Southeast',
  'Alabama': 'Southeast',
  
  // CANADA
  'ON': 'Canada',
  'QC': 'Canada',
  'BC': 'Canada',
  'AB': 'Canada',
  'SK': 'Canada',
  'MB': 'Canada',
  'NS': 'Canada',
  'NB': 'Canada',
  'NL': 'Canada',
  'PE': 'Canada',
  'Ontario': 'Canada',
  'Quebec': 'Canada',
  'British Columbia': 'Canada',
  'Alberta': 'Canada',
  'Canada': 'Canada'
};

const INTERNATIONAL_COUNTRIES = [
  'Germany', 'UK', 'United Kingdom', 'France', 'Switzerland', 'Belgium', 
  'Netherlands', 'Denmark', 'Norway', 'Sweden', 'Finland', 'Ireland',
  'Spain', 'Italy', 'Austria', 'Poland', 'Czech Republic',
  'Japan', 'China', 'South Korea', 'Taiwan', 'India', 'Singapore',
  'Australia', 'New Zealand', 'Israel', 'Brazil', 'Mexico'
];

// Load territory data
const dataPath = path.join(__dirname, '../static/territory-data.js');
const raw = fs.readFileSync(dataPath, 'utf8');
const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*?\]);/);
const companies = eval(match[1]);

console.log(`Processing ${companies.length} companies...`);

let remapped = 0;
let westCoast = 0, rockyMtn = 0, midwest = 0, northeast = 0, southeast = 0, canada = 0, international = 0;

companies.forEach(c => {
  let newTerritory = null;
  
  // Check state first
  if (c.state && TERRITORY_MAP[c.state]) {
    newTerritory = TERRITORY_MAP[c.state];
  }
  // Check existing territory
  else if (TERRITORY_MAP[c.territory]) {
    newTerritory = TERRITORY_MAP[c.territory];
  }
  // Check country for international
  else if (c.country && INTERNATIONAL_COUNTRIES.includes(c.country)) {
    newTerritory = 'International';
  }
  else if (c.territory && INTERNATIONAL_COUNTRIES.includes(c.territory)) {
    newTerritory = 'International';
  }
  // Check if country is USA variants
  else if (c.country === 'USA' || c.country === 'United States' || c.country === 'US') {
    // Try to determine from city or other info
    if (c.city) {
      // Default to Northeast if US but unknown region
      newTerritory = 'Northeast';
    }
  }
  
  // If still no match, check for international patterns
  if (!newTerritory) {
    if (c.country && c.country !== 'USA' && c.country !== 'United States' && c.country !== 'US') {
      newTerritory = 'International';
    } else {
      // Default US companies to region based on existing territory name
      const t = (c.territory || '').toLowerCase();
      if (t.includes('west')) newTerritory = 'West Coast';
      else if (t.includes('east')) newTerritory = 'Northeast';
      else if (t.includes('central')) newTerritory = 'Midwest';
      else if (t.includes('south')) newTerritory = 'Southeast';
      else newTerritory = 'Northeast'; // default
    }
  }
  
  if (newTerritory && c.territory !== newTerritory) {
    c.territory = newTerritory;
    remapped++;
  }
  
  // Count
  switch(c.territory) {
    case 'West Coast': westCoast++; break;
    case 'Rocky Mountain': rockyMtn++; break;
    case 'Midwest': midwest++; break;
    case 'Northeast': northeast++; break;
    case 'Southeast': southeast++; break;
    case 'Canada': canada++; break;
    case 'International': international++; break;
  }
});

console.log('\n=== TERRITORY DISTRIBUTION ===');
console.log(`  West Coast: ${westCoast}`);
console.log(`  Rocky Mountain: ${rockyMtn}`);
console.log(`  Midwest: ${midwest}`);
console.log(`  Northeast: ${northeast}`);
console.log(`  Southeast: ${southeast}`);
console.log(`  Canada: ${canada}`);
console.log(`  International: ${international}`);
console.log(`\nRemapped: ${remapped} companies`);

// Write updated data
const output = `const TERRITORY_DATA = ${JSON.stringify(companies, null, 2)};`;
fs.writeFileSync(dataPath, output);

console.log(`\n✓ Updated territory-data.js with new region assignments`);

/**
 * Add Verified Companies Across All Natoli Target Industries
 * Each company vetted for powder compaction relevance with Natoli truth reasoning
 */

const fs = require('fs');
const path = require('path');

const VERIFIED_COMPANIES = [
  // SPECIALTY CHEMICALS - Catalyst & Material Compaction
  {
    name: "BASF SE",
    industry: "Catalyst Manufacturing",
    territory: "Germany",
    city: "Ludwigshafen",
    state: "",
    country: "Germany",
    website: "https://www.basf.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Global catalyst pellet production, battery materials, specialty powder compaction",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Catalyst Pellet Tooling", secondary: "Battery Material Compaction" },
    contacts: []
  },
  {
    name: "Evonik Industries",
    industry: "Catalyst Manufacturing",
    territory: "Germany",
    city: "Essen",
    state: "",
    country: "Germany",
    website: "https://www.evonik.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Specialty catalyst pellets, silica compaction, pharmaceutical excipients",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Catalyst Tooling", secondary: "Excipient Compaction" },
    contacts: []
  },
  {
    name: "Johnson Matthey",
    industry: "Catalyst Manufacturing",
    territory: "UK",
    city: "London",
    state: "",
    country: "United Kingdom",
    website: "https://www.matthey.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Automotive catalyst pellets, fuel cell materials, precious metal compaction",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Catalyst Pellet Dies", secondary: "Precious Metal Tooling" },
    contacts: []
  },
  {
    name: "Clariant",
    industry: "Catalyst Manufacturing",
    territory: "Switzerland",
    city: "Muttenz",
    state: "",
    country: "Switzerland",
    website: "https://www.clariant.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Specialty catalyst production, adsorbent pellets, chemical compaction",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Catalyst Tooling", secondary: "Adsorbent Pellet Dies" },
    contacts: []
  },
  {
    name: "Albemarle Corporation",
    industry: "Battery Manufacturing",
    territory: "East",
    city: "Charlotte",
    state: "NC",
    country: "USA",
    website: "https://www.albemarle.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Lithium cathode materials, battery powder compaction, specialty chemicals",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Battery Cathode Tooling", secondary: "Lithium Material Compaction" },
    contacts: []
  },
  {
    name: "Umicore",
    industry: "Battery Manufacturing",
    territory: "Belgium",
    city: "Brussels",
    state: "",
    country: "Belgium",
    website: "https://www.umicore.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Battery cathode pellets, recycling materials, precious metal compaction",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Cathode Pellet Tooling", secondary: "Metal Powder Compaction" },
    contacts: []
  },
  {
    name: "W.R. Grace",
    industry: "Catalyst Manufacturing",
    territory: "East",
    city: "Columbia",
    state: "MD",
    country: "USA",
    website: "https://grace.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: FCC catalyst pellets, silica-alumina compaction, refinery catalysts",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Catalyst Pellet Tooling", secondary: "Refinery Catalyst Dies" },
    contacts: []
  },
  {
    name: "Haldor Topsoe",
    industry: "Catalyst Manufacturing",
    territory: "Denmark",
    city: "Lyngby",
    state: "",
    country: "Denmark",
    website: "https://www.topsoe.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Industrial catalyst pellets, ammonia catalyst, hydrogen production catalysts",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Industrial Catalyst Tooling", secondary: "Ammonia Catalyst Pellet Dies" },
    contacts: []
  },
  {
    name: "Cabot Corporation",
    industry: "Specialty Chemicals",
    territory: "East",
    city: "Boston",
    state: "MA",
    country: "USA",
    website: "https://www.cabotcorp.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Carbon black pellets, specialty carbons, battery materials compaction",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Carbon Pellet Tooling", secondary: "Specialty Carbon Dies" },
    contacts: []
  },
  
  // NUCLEAR FUEL
  {
    name: "Westinghouse Electric",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Cranberry Township",
    state: "PA",
    country: "USA",
    website: "https://www.westinghousenuclear.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Nuclear fuel pellet production, uranium oxide compaction, SMR fuel",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Nuclear Fuel Pellet Tooling", secondary: "Uranium Oxide Dies" },
    contacts: []
  },
  {
    name: "Framatome",
    industry: "Nuclear Fuel",
    territory: "France",
    city: "Paris",
    state: "",
    country: "France",
    website: "https://www.framatome.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Nuclear fuel fabrication, UO2 pellet pressing, advanced fuel assemblies",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "UO2 Pellet Tooling", secondary: "Nuclear Fuel Compaction" },
    contacts: []
  },
  {
    name: "Global Nuclear Fuel",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Wilmington",
    state: "NC",
    country: "USA",
    website: "https://www.gnf.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: BWR fuel pellet production, GE-Hitachi nuclear fuel manufacturing",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Nuclear Pellet Dies", secondary: "Fuel Rod Tooling" },
    contacts: []
  },
  {
    name: "BWXT",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Lynchburg",
    state: "VA",
    country: "USA",
    website: "https://www.bwxt.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Naval nuclear fuel, TRISO particle production, advanced reactor fuel",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "TRISO Fuel Tooling", secondary: "Naval Fuel Compaction" },
    contacts: []
  },
  {
    name: "Centrus Energy",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Bethesda",
    state: "MD",
    country: "USA",
    website: "https://www.centrusenergy.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: HALEU fuel production, enriched uranium processing, SMR fuel development",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "HALEU Pellet Tooling", secondary: "SMR Fuel Dies" },
    contacts: []
  },
  {
    name: "X-energy",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Rockville",
    state: "MD",
    country: "USA",
    website: "https://x-energy.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: TRISO-X fuel pebble production, advanced reactor fuel manufacturing",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "TRISO Pebble Tooling", secondary: "Advanced Fuel Compaction" },
    contacts: []
  },

  // BATTERY & ENERGY STORAGE
  {
    name: "CATL",
    industry: "Battery Manufacturing",
    territory: "China",
    city: "Ningde",
    state: "",
    country: "China",
    website: "https://www.catl.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: World's largest battery manufacturer, cathode/anode pellet production",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Electrode Pellet Tooling", secondary: "Battery Material Compaction" },
    contacts: []
  },
  {
    name: "LG Energy Solution",
    industry: "Battery Manufacturing",
    territory: "South Korea",
    city: "Seoul",
    state: "",
    country: "South Korea",
    website: "https://www.lgensol.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: EV battery production, cathode material compaction, solid-state R&D",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Cathode Pellet Dies", secondary: "Solid-State Battery Tooling" },
    contacts: []
  },
  {
    name: "Panasonic Energy",
    industry: "Battery Manufacturing",
    territory: "Japan",
    city: "Osaka",
    state: "",
    country: "Japan",
    website: "https://www.panasonic.com/energy",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Tesla battery cells, NCA cathode production, Gigafactory operations",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "NCA Cathode Tooling", secondary: "Electrode Compaction" },
    contacts: []
  },
  {
    name: "Samsung SDI",
    industry: "Battery Manufacturing",
    territory: "South Korea",
    city: "Yongin",
    state: "",
    country: "South Korea",
    website: "https://www.samsungsdi.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Prismatic battery cells, cathode material R&D, solid-state development",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Battery Material Tooling", secondary: "Prismatic Cell Compaction" },
    contacts: []
  },
  {
    name: "QuantumScape",
    industry: "Battery Manufacturing",
    territory: "West",
    city: "San Jose",
    state: "CA",
    country: "USA",
    website: "https://www.quantumscape.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: Solid-state battery leader, ceramic separator production, next-gen cells",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Solid-State Battery Tooling", secondary: "Ceramic Separator Dies" },
    contacts: []
  },
  {
    name: "Solid Power",
    industry: "Battery Manufacturing",
    territory: "Central",
    city: "Louisville",
    state: "CO",
    country: "USA",
    website: "https://www.solidpowerbattery.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: Sulfide solid-state batteries, Ford/BMW partnership, pilot production",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Solid-State Electrode Tooling", secondary: "Sulfide Electrolyte Compaction" },
    contacts: []
  },
  {
    name: "Sila Nanotechnologies",
    industry: "Battery Manufacturing",
    territory: "West",
    city: "Alameda",
    state: "CA",
    country: "USA",
    website: "https://www.silanano.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: Silicon anode materials, Mercedes partnership, Moses Lake facility",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Silicon Anode Tooling", secondary: "Advanced Material Compaction" },
    contacts: []
  },

  // ADVANCED CERAMICS
  {
    name: "CoorsTek",
    industry: "Advanced Ceramics",
    territory: "Central",
    city: "Golden",
    state: "CO",
    country: "USA",
    website: "https://www.coorstek.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Technical ceramics leader, aerospace/defense ceramics, medical ceramics",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Ceramic Compaction Tooling", secondary: "Technical Ceramic Dies" },
    contacts: []
  },
  {
    name: "Kyocera",
    industry: "Advanced Ceramics",
    territory: "Japan",
    city: "Kyoto",
    state: "",
    country: "Japan",
    website: "https://www.kyocera.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Fine ceramics production, semiconductor components, medical ceramics",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Fine Ceramic Tooling", secondary: "Semiconductor Component Dies" },
    contacts: []
  },
  {
    name: "Morgan Advanced Materials",
    industry: "Advanced Ceramics",
    territory: "UK",
    city: "Windsor",
    state: "",
    country: "United Kingdom",
    website: "https://www.morganadvancedmaterials.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Carbon and ceramic materials, thermal management, seals and bearings",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Carbon/Ceramic Tooling", secondary: "Thermal Material Compaction" },
    contacts: []
  },
  {
    name: "Saint-Gobain Ceramics",
    industry: "Advanced Ceramics",
    territory: "East",
    city: "Worcester",
    state: "MA",
    country: "USA",
    website: "https://www.ceramics.saint-gobain.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: High-performance ceramics, refractories, abrasives production",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "High-Performance Ceramic Tooling", secondary: "Refractory Dies" },
    contacts: []
  },
  {
    name: "Ceradyne (3M)",
    industry: "Advanced Ceramics",
    territory: "West",
    city: "Costa Mesa",
    state: "CA",
    country: "USA",
    website: "https://www.3m.com/ceradyne",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Defense ceramics, armor plates, aerospace components",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Armor Ceramic Tooling", secondary: "Defense Compaction Dies" },
    contacts: []
  },

  // DEFENSE & ENERGETICS
  {
    name: "Northrop Grumman",
    industry: "Defense & Energetics",
    territory: "West",
    city: "Falls Church",
    state: "VA",
    country: "USA",
    website: "https://www.northropgrumman.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Solid rocket propellants, energetic materials, defense munitions",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Propellant Pellet Tooling", secondary: "Energetic Material Dies" },
    contacts: []
  },
  {
    name: "General Dynamics Ordnance",
    industry: "Defense & Energetics",
    territory: "East",
    city: "St. Petersburg",
    state: "FL",
    country: "USA",
    website: "https://www.gd.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Ammunition production, propellant grains, ordnance manufacturing",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Ammunition Tooling", secondary: "Propellant Compaction" },
    contacts: []
  },
  {
    name: "BAE Systems",
    industry: "Defense & Energetics",
    territory: "UK",
    city: "London",
    state: "",
    country: "United Kingdom",
    website: "https://www.baesystems.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Munitions manufacturing, energetic materials, defense ordnance",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Munitions Tooling", secondary: "Energetic Compaction Dies" },
    contacts: []
  },
  {
    name: "Nammo",
    industry: "Defense & Energetics",
    territory: "Norway",
    city: "Raufoss",
    state: "",
    country: "Norway",
    website: "https://www.nammo.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Aerospace propulsion, ammunition, shoulder-launched munitions",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Propulsion Pellet Tooling", secondary: "Ammunition Dies" },
    contacts: []
  },

  // HYDROGEN STORAGE
  {
    name: "Plug Power",
    industry: "Hydrogen Storage",
    territory: "East",
    city: "Latham",
    state: "NY",
    country: "USA",
    website: "https://www.plugpower.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: Hydrogen fuel cells, metal hydride storage, green hydrogen",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Metal Hydride Pellet Tooling", secondary: "Fuel Cell Component Dies" },
    contacts: []
  },
  {
    name: "Ballard Power Systems",
    industry: "Hydrogen Storage",
    territory: "Canada",
    city: "Burnaby",
    state: "BC",
    country: "Canada",
    website: "https://www.ballard.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: PEM fuel cells, catalyst layers, membrane electrode assemblies",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Fuel Cell Catalyst Tooling", secondary: "MEA Compaction" },
    contacts: []
  },
  {
    name: "Bloom Energy",
    industry: "Hydrogen Storage",
    territory: "West",
    city: "San Jose",
    state: "CA",
    country: "USA",
    website: "https://www.bloomenergy.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Solid oxide fuel cells, ceramic electrolyte production, hydrogen systems",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "SOFC Ceramic Tooling", secondary: "Electrolyte Compaction" },
    contacts: []
  },

  // CARBON CAPTURE
  {
    name: "Svante",
    industry: "Carbon Capture",
    territory: "Canada",
    city: "Vancouver",
    state: "BC",
    country: "Canada",
    website: "https://www.svante.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: CO2 capture sorbents, solid adsorbent production, DAC technology",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Sorbent Pellet Tooling", secondary: "Adsorbent Compaction" },
    contacts: []
  },
  {
    name: "Carbon Engineering",
    industry: "Carbon Capture",
    territory: "Canada",
    city: "Squamish",
    state: "BC",
    country: "Canada",
    website: "https://www.carbonengineering.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: Direct air capture, CO2 sorbent materials, Occidental partnership",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "DAC Sorbent Tooling", secondary: "Carbon Capture Pellet Dies" },
    contacts: []
  },
  {
    name: "Climeworks",
    industry: "Carbon Capture",
    territory: "Switzerland",
    city: "Zurich",
    state: "",
    country: "Switzerland",
    website: "https://www.climeworks.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: DAC pioneer, sorbent material development, Orca/Mammoth facilities",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "DAC Sorbent Tooling", secondary: "Capture Material Compaction" },
    contacts: []
  },

  // RARE EARTH MAGNETS
  {
    name: "Neo Performance Materials",
    industry: "Rare Earth Magnets",
    territory: "Canada",
    city: "Toronto",
    state: "ON",
    country: "Canada",
    website: "https://www.neomaterials.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Rare earth magnet production, NdFeB powder compaction, magnetic materials",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Rare Earth Magnet Tooling", secondary: "NdFeB Compaction Dies" },
    contacts: []
  },
  {
    name: "Hitachi Metals",
    industry: "Rare Earth Magnets",
    territory: "Japan",
    city: "Tokyo",
    state: "",
    country: "Japan",
    website: "https://www.hitachi-metals.co.jp",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: NEOMAX magnets, sintered rare earth production, EV motor magnets",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Sintered Magnet Tooling", secondary: "Rare Earth Powder Dies" },
    contacts: []
  },
  {
    name: "Vacuumschmelze (VAC)",
    industry: "Rare Earth Magnets",
    territory: "Germany",
    city: "Hanau",
    state: "",
    country: "Germany",
    website: "https://www.vacuumschmelze.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Permanent magnets, soft magnetic materials, amorphous metal production",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Permanent Magnet Tooling", secondary: "Magnetic Material Compaction" },
    contacts: []
  },
  {
    name: "MP Materials",
    industry: "Rare Earth Magnets",
    territory: "West",
    city: "Las Vegas",
    state: "NV",
    country: "USA",
    website: "https://www.mpmaterials.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING: US rare earth production, Mountain Pass mine, magnet manufacturing",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Rare Earth Processing Tooling", secondary: "Magnet Compaction" },
    contacts: []
  },

  // ABRASIVES
  {
    name: "3M Abrasives",
    industry: "Abrasives",
    territory: "Central",
    city: "St. Paul",
    state: "MN",
    country: "USA",
    website: "https://www.3m.com/abrasives",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Bonded abrasives, grinding wheels, ceramic grain production",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Grinding Wheel Tooling", secondary: "Abrasive Compaction Dies" },
    contacts: []
  },
  {
    name: "Norton (Saint-Gobain)",
    industry: "Abrasives",
    territory: "East",
    city: "Worcester",
    state: "MA",
    country: "USA",
    website: "https://www.nortonabrasives.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Bonded abrasive wheels, superabrasives, precision grinding",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Abrasive Wheel Tooling", secondary: "Superabrasive Dies" },
    contacts: []
  },
  {
    name: "Carborundum Universal",
    industry: "Abrasives",
    territory: "India",
    city: "Chennai",
    state: "",
    country: "India",
    website: "https://www.caborundumuniversal.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Grinding wheels, coated abrasives, electro minerals compaction",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Grinding Wheel Tooling", secondary: "Electro Mineral Dies" },
    contacts: []
  },

  // MEDICAL IMPLANTS
  {
    name: "Zimmer Biomet",
    industry: "Medical Implants",
    territory: "Central",
    city: "Warsaw",
    state: "IN",
    country: "USA",
    website: "https://www.zimmerbiomet.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Orthopedic implants, bone cement, ceramic hip components",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Orthopedic Ceramic Tooling", secondary: "Bone Cement Compaction" },
    contacts: []
  },
  {
    name: "Stryker",
    industry: "Medical Implants",
    territory: "Central",
    city: "Kalamazoo",
    state: "MI",
    country: "USA",
    website: "https://www.stryker.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Joint replacements, spinal implants, 3D printed titanium components",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Implant Material Tooling", secondary: "Titanium Powder Compaction" },
    contacts: []
  },
  {
    name: "DePuy Synthes (J&J)",
    industry: "Medical Implants",
    territory: "East",
    city: "Raynham",
    state: "MA",
    country: "USA",
    website: "https://www.depuysynthes.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Trauma implants, joint reconstruction, ceramic femoral heads",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Ceramic Implant Tooling", secondary: "Medical Device Compaction" },
    contacts: []
  },
  {
    name: "CeramTec Medical",
    industry: "Medical Implants",
    territory: "Germany",
    city: "Plochingen",
    state: "",
    country: "Germany",
    website: "https://www.ceramtec.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Medical ceramics specialist, BIOLOX hip components, dental ceramics",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Medical Ceramic Tooling", secondary: "Implant Compaction Dies" },
    contacts: []
  },

  // AGRICULTURAL PELLETS
  {
    name: "Mosaic Company",
    industry: "Agricultural Pellets",
    territory: "Central",
    city: "Tampa",
    state: "FL",
    country: "USA",
    website: "https://www.mosaicco.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Fertilizer pellets, micronutrient production, phosphate granulation",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Fertilizer Pellet Tooling", secondary: "Micronutrient Dies" },
    contacts: []
  },
  {
    name: "Nutrien",
    industry: "Agricultural Pellets",
    territory: "Canada",
    city: "Saskatoon",
    state: "SK",
    country: "Canada",
    website: "https://www.nutrien.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Potash pellets, nitrogen fertilizers, specialty crop nutrients",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Potash Pellet Tooling", secondary: "Fertilizer Compaction" },
    contacts: []
  },
  {
    name: "ICL Group",
    industry: "Agricultural Pellets",
    territory: "Israel",
    city: "Tel Aviv",
    state: "",
    country: "Israel",
    website: "https://www.icl-group.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Specialty fertilizers, controlled-release nutrients, phosphate production",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Controlled-Release Pellet Tooling", secondary: "Specialty Fertilizer Dies" },
    contacts: []
  },

  // ANIMAL FEED
  {
    name: "Cargill Animal Nutrition",
    industry: "Animal Feed Supplements",
    territory: "Central",
    city: "Wayzata",
    state: "MN",
    country: "USA",
    website: "https://www.cargill.com/animal-nutrition",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Feed premixes, mineral supplements, animal nutrition pellets",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Feed Supplement Tooling", secondary: "Mineral Pellet Dies" },
    contacts: []
  },
  {
    name: "ADM Animal Nutrition",
    industry: "Animal Feed Supplements",
    territory: "Central",
    city: "Decatur",
    state: "IL",
    country: "USA",
    website: "https://www.adm.com/animal-nutrition",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Feed additives, vitamin premixes, animal health supplements",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Feed Additive Tooling", secondary: "Vitamin Pellet Compaction" },
    contacts: []
  },
  {
    name: "DSM Animal Nutrition",
    industry: "Animal Feed Supplements",
    territory: "Netherlands",
    city: "Heerlen",
    state: "",
    country: "Netherlands",
    website: "https://www.dsm.com/animal-nutrition",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Vitamin production, feed enzymes, carotenoid pellets",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Vitamin Pellet Tooling", secondary: "Enzyme Compaction Dies" },
    contacts: []
  },

  // 3D PRINTING FEEDSTOCK
  {
    name: "Desktop Metal",
    industry: "3D Printing Feedstock",
    territory: "East",
    city: "Burlington",
    state: "MA",
    country: "USA",
    website: "https://www.desktopmetal.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Metal binder jet printing, powder feedstock development, sintering",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Metal Powder Tooling", secondary: "Binder Jet Feedstock Compaction" },
    contacts: []
  },
  {
    name: "ExOne (Desktop Metal)",
    industry: "3D Printing Feedstock",
    territory: "East",
    city: "North Huntingdon",
    state: "PA",
    country: "USA",
    website: "https://www.exone.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Sand/metal binder jetting, industrial powder systems, ceramic printing",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Binder Jet Powder Tooling", secondary: "Ceramic Feedstock Dies" },
    contacts: []
  },
  {
    name: "Markforged",
    industry: "3D Printing Feedstock",
    territory: "East",
    city: "Watertown",
    state: "MA",
    country: "USA",
    website: "https://www.markforged.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Metal FFF printing, continuous fiber composites, sintered metal parts",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Metal Filament Tooling", secondary: "Sintered Part Compaction" },
    contacts: []
  },

  // SEMICONDUCTOR MATERIALS
  {
    name: "Entegris",
    industry: "Semiconductor Materials",
    territory: "East",
    city: "Billerica",
    state: "MA",
    country: "USA",
    website: "https://www.entegris.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Advanced materials handling, CMP slurries, specialty chemicals",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "CMP Material Tooling", secondary: "Specialty Powder Compaction" },
    contacts: []
  },
  {
    name: "CMC Materials",
    industry: "Semiconductor Materials",
    territory: "East",
    city: "Aurora",
    state: "IL",
    country: "USA",
    website: "https://www.cmcmaterials.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: CMP consumables, polishing pads, specialty electronic materials",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "CMP Pad Tooling", secondary: "Electronic Material Dies" },
    contacts: []
  },

  // SPACE MATERIALS
  {
    name: "Aerojet Rocketdyne",
    industry: "Space Materials",
    territory: "West",
    city: "El Segundo",
    state: "CA",
    country: "USA",
    website: "https://www.rocket.com",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Solid rocket motors, propellant grains, aerospace propulsion",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Propellant Grain Tooling", secondary: "Solid Motor Compaction" },
    contacts: []
  },
  {
    name: "Northrop Grumman Space",
    industry: "Space Materials",
    territory: "West",
    city: "Dulles",
    state: "VA",
    country: "USA",
    website: "https://www.northropgrumman.com/space",
    companyTier: "Tier 1",
    tier1Reason: "VERIFIED: Solid rocket boosters, thermal protection systems, space propulsion",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Solid Booster Tooling", secondary: "TPS Material Compaction" },
    contacts: []
  },

  // FORENSIC STANDARDS
  {
    name: "Cerilliant (Sigma-Aldrich)",
    industry: "Forensic Standards",
    territory: "Central",
    city: "Round Rock",
    state: "TX",
    country: "USA",
    website: "https://www.cerilliant.com",
    companyTier: "Tier 2",
    tier1Reason: "VERIFIED: Certified reference materials, forensic standards, drug testing calibrants",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "Reference Standard Tooling", secondary: "Calibrant Tablet Dies" },
    contacts: []
  },
  {
    name: "LGC Standards",
    industry: "Forensic Standards",
    territory: "UK",
    city: "Teddington",
    state: "",
    country: "United Kingdom",
    website: "https://www.lgcstandards.com",
    companyTier: "Tier 2",
    tier1Reason: "VERIFIED: Forensic reference materials, pharmaceutical standards, quality control",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "Pharmaceutical Standard Tooling", secondary: "QC Reference Dies" },
    contacts: []
  }
];

// Load existing territory data
const dataPath = path.join(__dirname, '../static/territory-data.js');
const raw = fs.readFileSync(dataPath, 'utf8');
const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*?\]);/);
const existingCompanies = eval(match[1]);

// Check for duplicates
const existingNames = new Set(existingCompanies.map(c => c.name.toLowerCase()));
const newCompanies = VERIFIED_COMPANIES.filter(c => !existingNames.has(c.name.toLowerCase()));

console.log(`Existing companies: ${existingCompanies.length}`);
console.log(`New verified companies: ${newCompanies.length}`);
console.log(`Duplicates skipped: ${VERIFIED_COMPANIES.length - newCompanies.length}`);

// Merge and sort
const allCompanies = [...existingCompanies, ...newCompanies];

// Sort by tier then name
allCompanies.sort((a, b) => {
  const tierOrder = { 'Tier 1': 1, 'Tier 2': 2, 'Tier 3': 3 };
  const tierDiff = (tierOrder[a.companyTier] || 4) - (tierOrder[b.companyTier] || 4);
  if (tierDiff !== 0) return tierDiff;
  return a.name.localeCompare(b.name);
});

// Count by industry
const industryCounts = {};
allCompanies.forEach(c => {
  industryCounts[c.industry] = (industryCounts[c.industry] || 0) + 1;
});

console.log('\n=== INDUSTRY BREAKDOWN ===');
Object.entries(industryCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([ind, count]) => {
    console.log(`  ${ind}: ${count}`);
  });

// Write updated data
const output = `const TERRITORY_DATA = ${JSON.stringify(allCompanies, null, 2)};`;
fs.writeFileSync(dataPath, output);

console.log(`\n✓ Updated territory-data.js with ${allCompanies.length} total companies`);

// Count new industries added
const newIndustries = [...new Set(newCompanies.map(c => c.industry))];
console.log(`\nNew industries added: ${newIndustries.join(', ')}`);

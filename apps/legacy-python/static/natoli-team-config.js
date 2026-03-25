const NATOLI_TEAM = {
  cxReps: [
    { name: "Gregory Lyle", email: "cx-greg@natoli.com", title: "Customer Experience" },
    { name: "Ada Obi-Ibeabuchi", email: "cx-ada@natoli.com", title: "Customer Experience" },
    { name: "Christopher Tichacek", email: "cx-christopher@natoli.com", title: "Customer Experience" },
    { name: "Elisabeth Colburn", email: "cx-elisabeth@natoli.com", title: "Customer Experience" },
    { name: "Kate Emmerth", email: "cx-kate@natoli.com", title: "Customer Experience" },
    { name: "Eric Tucker", email: "cx-eric@natoli.com", title: "Customer Experience" }
  ],
  
  salesReps: {
    "West Coast": {
      rep: { name: "Fernando Delgado", email: "" },
      tooling: { name: "Anna King", email: "" },
      parts: { name: "Angie Diaz", email: "" },
      states: ["CA", "OR", "WA", "HI", "AK", "NV"]
    },
    "Rocky Mountain": {
      rep: { name: "Eric Maughan", email: "" },
      tooling: { name: "Anna King", email: "" },
      parts: { name: "Natalie Bausch", email: "" },
      states: ["CO", "UT", "AZ", "NM", "WY", "MT", "ID"]
    },
    "Midwest": {
      rep: null,
      tooling: { name: "David Nelson", email: "" },
      parts: { name: "Arthur Dodson / Jennifer Bergauer", email: "" },
      states: ["IL", "IN", "OH", "MI", "WI", "MN", "IA", "MO", "KS", "NE", "SD", "ND"]
    },
    "Northeast": {
      rep: { name: "Raffaele Romano", email: "" },
      tooling: { name: "Samantha Bowman", email: "" },
      parts: { name: "Kelley Jeffries", email: "" },
      states: ["NY", "NJ", "PA", "MA", "CT", "RI", "NH", "VT", "ME", "MD", "DE", "DC"]
    },
    "Southeast": {
      rep: { name: "Danny Ambrose", email: "" },
      tooling: { name: "Heather Noll", email: "" },
      parts: { name: "Natalie Bausch", email: "" },
      states: ["FL", "GA", "NC", "SC", "VA", "WV", "TN", "KY", "AL", "MS", "LA", "AR", "OK", "TX"]
    },
    "Puerto Rico": {
      rep: { name: "Emmanuel/Noel Davilla", email: "" },
      tooling: { name: "Tiffany Simonpietri", email: "" },
      parts: { name: "Natalie Bausch", email: "" },
      states: ["PR"]
    },
    "Canada": {
      rep: { name: "Fazal Mohideen", email: "" },
      tooling: { name: "David Nelson", email: "" },
      parts: { name: "Arthur Dodson", email: "" },
      states: []
    }
  },
  
  encapsulation: {
    contact: { name: "Caitlyn Partl", email: "", title: "Encapsulation Inquiries" }
  }
};

function getRegionByState(stateCode) {
  for (const [region, data] of Object.entries(NATOLI_TEAM.salesReps)) {
    if (data.states.includes(stateCode.toUpperCase())) {
      return { region, ...data };
    }
  }
  return null;
}

function getSalesRepByState(stateCode) {
  const region = getRegionByState(stateCode);
  if (region && region.rep) {
    return region.rep.name;
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NATOLI_TEAM, getRegionByState, getSalesRepByState };
}

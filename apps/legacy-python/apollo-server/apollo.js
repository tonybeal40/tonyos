import fetch from "node-fetch";

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

export async function enrichCompany(domain) {
  const url = "https://api.apollo.io/api/v1/organizations/search";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": APOLLO_API_KEY
    },
    body: JSON.stringify({
      q_organization_name: domain,
      page: 1,
      per_page: 1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.organizations?.[0] || null;
}

export async function enrichDomain(domain) {
  const cleanDomain = domain.toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  const url = `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(cleanDomain)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": APOLLO_API_KEY
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return await enrichCompany(cleanDomain);
    }
    throw new Error(`Apollo enrich error: ${response.status}`);
  }

  const data = await response.json();
  return data.organization || null;
}

export async function findPeopleAtCompany(companyId, titles = []) {
  const url = "https://api.apollo.io/api/v1/mixed_people/search";

  const body = {
    organization_ids: [companyId],
    page: 1,
    per_page: 25
  };

  if (titles && titles.length > 0) {
    body.person_titles = titles;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": APOLLO_API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Apollo people search error: ${response.status}`);
  }

  const data = await response.json();
  return data.people || [];
}

export async function searchCompanies(query, options = {}) {
  const url = "https://api.apollo.io/api/v1/mixed_companies/search";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": APOLLO_API_KEY
    },
    body: JSON.stringify({
      q_organization_name: query,
      page: options.page || 1,
      per_page: options.per_page || 10
    })
  });

  if (!response.ok) {
    throw new Error(`Apollo search error: ${response.status}`);
  }

  const data = await response.json();
  return data.organizations || [];
}

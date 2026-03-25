const TRUSTED_SOURCES = [
  "reuters.com",
  "bloomberg.com",
  "wsj.com",
  "fda.gov",
  "ema.europa.eu",
  "contractpharma.com",
  "nutraceuticalsworld.com",
  "pharmtech.com",
  "fiercepharma.com",
  "pharmamanufacturing.com",
  "nutritionaloutlook.com",
  "nutraingredients.com",
  "drugtopics.com",
  "pharmaceutical-technology.com",
  "biopharminternational.com"
];

export async function fetchCompanyNews(companyName) {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    console.log("[news] No NEWS_API_KEY configured");
    return [];
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const url = `https://newsapi.org/v2/everything?q="${encodeURIComponent(companyName)}"&language=en&sortBy=publishedAt&from=${fromDate}&pageSize=50&apiKey=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "ok" || !data.articles) {
      console.log("[news] API error:", data.message || "No articles");
      return [];
    }

    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const filtered = data.articles
      .filter(a => {
        if (!a.url || !a.publishedAt) return false;
        const published = new Date(a.publishedAt).getTime();
        if (published < last30Days) return false;

        return TRUSTED_SOURCES.some(source =>
          a.url.toLowerCase().includes(source)
        );
      })
      .slice(0, 5)
      .map(a => ({
        title: a.title,
        source: a.source?.name || "Unknown",
        url: a.url,
        published_at: a.publishedAt,
        summary: a.description || ""
      }));

    console.log(`[news] Found ${filtered.length} trusted articles for "${companyName}"`);
    return filtered;

  } catch (err) {
    console.error("[news] Fetch error:", err.message);
    return [];
  }
}

export async function fetchAllNews(companyName) {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    return [];
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const url = `https://newsapi.org/v2/everything?q="${encodeURIComponent(companyName)}"&language=en&sortBy=publishedAt&from=${fromDate}&pageSize=20&apiKey=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "ok" || !data.articles) {
      return [];
    }

    return data.articles
      .slice(0, 5)
      .map(a => ({
        title: a.title,
        source: a.source?.name || "Unknown",
        url: a.url,
        published_at: a.publishedAt,
        summary: a.description || ""
      }));

  } catch (err) {
    console.error("[news] Fetch all error:", err.message);
    return [];
  }
}

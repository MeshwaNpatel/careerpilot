const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';

async function fetchAdzunaJobs(keyword, country, page) {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    what: keyword || 'software engineer',
    results_per_page: 20,
    sort_by: 'date',
  });

  const res = await fetch(`${ADZUNA_BASE}/${country}/search/${page}?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results || []).map((job) => ({
    id: `adzuna_${job.id}`,
    title: job.title,
    company: job.company?.display_name || 'Unknown',
    location: job.location?.display_name || '',
    salaryMin: job.salary_min ? Math.round(job.salary_min) : null,
    salaryMax: job.salary_max ? Math.round(job.salary_max) : null,
    url: job.redirect_url,
    source: 'adzuna',
    postedAt: job.created,
    description: job.description || '',
    jobType: job.contract_time?.replace('_', '-') || null,
    isRemote: false,
  }));
}

async function fetchRemotiveJobs(keyword) {
  const params = new URLSearchParams({ search: keyword || 'software', limit: 15 });
  const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.jobs || []).map((job) => ({
    id: `remotive_${job.id}`,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || 'Remote (Worldwide)',
    salaryMin: null,
    salaryMax: null,
    salary: job.salary || null,
    url: job.url,
    source: 'remotive',
    postedAt: job.publication_date,
    description: (job.description || '').replace(/<[^>]*>/g, '').slice(0, 400),
    jobType: job.job_type || null,
    isRemote: true,
  }));
}

async function fetchYCJobs() {
  const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json');
  const ids = await idsRes.json();

  const jobs = await Promise.all(
    ids.slice(0, 12).map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then((r) => r.json())
        .catch(() => null)
    )
  );

  return jobs
    .filter(Boolean)
    .map((job) => ({
      id: `yc_${job.id}`,
      title: extractYCTitle(job.title),
      company: extractYCCompany(job.title),
      location: 'USA (YC Company)',
      salaryMin: null,
      salaryMax: null,
      url: job.url || `https://news.ycombinator.com/item?id=${job.id}`,
      source: 'ycombinator',
      postedAt: new Date(job.time * 1000).toISOString(),
      description: (job.text || '').replace(/<[^>]*>/g, '').slice(0, 400),
      jobType: 'full-time',
      isRemote: false,
    }));
}

function extractYCCompany(title = '') {
  const match = title.match(/^([^(|]+)/);
  return match ? match[1].trim() : 'YC Company';
}

function extractYCTitle(title = '') {
  // "CompanyName (YC S24) is hiring a Senior Engineer" → "Senior Engineer"
  const match = title.match(/(?:is hiring|hiring)\s+(?:a\s+|an\s+)?(.+)$/i);
  return match ? match[1].trim() : title;
}

async function fetchRemoteOKJobs(keyword) {
  const tag = keyword ? encodeURIComponent(keyword.toLowerCase().split(' ')[0]) : 'dev';
  const res = await fetch(`https://remoteok.com/api?tags=${tag}`, {
    headers: { 'User-Agent': 'CareerPilot/1.0 (job aggregator)' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const jobs = Array.isArray(data) ? data.filter((j) => j.id && j.position) : [];

  return jobs.slice(0, 15).map((job) => ({
    id: `remoteok_${job.id}`,
    title: job.position,
    company: job.company || 'Unknown',
    location: job.location || 'Remote (Worldwide)',
    salaryMin: job.salary_min ? Math.round(job.salary_min) : null,
    salaryMax: job.salary_max ? Math.round(job.salary_max) : null,
    url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
    source: 'remoteok',
    postedAt: job.date || new Date().toISOString(),
    description: (job.description || '').replace(/<[^>]*>/g, '').slice(0, 400),
    jobType: 'full-time',
    isRemote: true,
  }));
}

async function fetchJobicyJobs(keyword) {
  const params = new URLSearchParams({ count: 20, geo: 'usa' });
  if (keyword) params.set('tag', keyword.split(' ')[0]);
  const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();

  return (data.jobs || []).map((job) => ({
    id: `jobicy_${job.id}`,
    title: job.jobTitle,
    company: job.companyName || 'Unknown',
    location: job.jobGeo || 'Remote (USA)',
    salaryMin: job.annualSalaryMin ? Math.round(job.annualSalaryMin) : null,
    salaryMax: job.annualSalaryMax ? Math.round(job.annualSalaryMax) : null,
    url: job.url,
    source: 'jobicy',
    postedAt: job.pubDate || new Date().toISOString(),
    description: (job.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 400),
    jobType: job.jobType || 'full-time',
    isRemote: true,
  }));
}

// Maps a free-text keyword to the closest Muse job category
function museCategory(keyword) {
  const kw = (keyword || '').toLowerCase();
  if (/data|ml|machine|ai|analyst/.test(kw)) return 'Data Science';
  if (/design|ux|ui|figma/.test(kw)) return 'Design';
  if (/product|pm|manager/.test(kw)) return 'Product';
  if (/devops|infra|cloud|sre|platform/.test(kw)) return 'DevOps / Sysadmin';
  if (/market|growth|seo|content/.test(kw)) return 'Marketing';
  if (/sale|account|revenue/.test(kw)) return 'Sales';
  return 'Software Engineer';
}

async function fetchMuseJobs(keyword) {
  if (!process.env.MUSE_API_KEY) return [];
  const params = new URLSearchParams({
    category: museCategory(keyword),
    page: 0,
    api_key: process.env.MUSE_API_KEY,
    descending: true,
  });
  const res = await fetch(`https://www.themuse.com/api/public/jobs?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results || []).slice(0, 15).map((job) => ({
    id: `themuse_${job.id}`,
    title: job.name,
    company: job.company?.name || 'Unknown',
    location: (job.locations || []).map((l) => l.name).join(', ') || 'USA',
    salaryMin: null,
    salaryMax: null,
    url: job.refs?.landing_page || 'https://www.themuse.com/jobs',
    source: 'themuse',
    postedAt: job.publication_date || new Date().toISOString(),
    description: (job.contents || '').replace(/<[^>]*>/g, '').slice(0, 400),
    jobType: job.type || 'full-time',
    isRemote: (job.locations || []).some((l) => /remote/i.test(l.name)),
  }));
}

function deduplicateJobs(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    const key = `${job.source}|${job.company.toLowerCase()}|${job.title.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, job);
    } else {
      // Keep whichever has the higher max salary
      const existingMax = existing.salaryMax ?? existing.salaryMin ?? 0;
      const jobMax = job.salaryMax ?? job.salaryMin ?? 0;
      if (jobMax > existingMax) seen.set(key, job);
    }
  }
  return Array.from(seen.values());
}

export async function searchJobs({ keyword = '', country = 'us', page = 1, source }) {
  const promises = [];

  if (!source || source === 'adzuna') {
    promises.push(fetchAdzunaJobs(keyword, country, page).catch(() => []));
  }
  if ((!source || source === 'remotive') && country !== 'in') {
    promises.push(fetchRemotiveJobs(keyword).catch(() => []));
  }
  if (!source || source === 'ycombinator') {
    promises.push(fetchYCJobs().catch(() => []));
  }
  if (!source || source === 'remoteok') {
    promises.push(fetchRemoteOKJobs(keyword).catch(() => []));
  }
  if (!source || source === 'jobicy') {
    promises.push(fetchJobicyJobs(keyword).catch(() => []));
  }
  if (!source || source === 'themuse') {
    promises.push(fetchMuseJobs(keyword).catch(() => []));
  }

  const results = await Promise.all(promises);
  const all = results.flat().sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  return deduplicateJobs(all);
}

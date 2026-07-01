import { useState, useRef, useLayoutEffect } from 'react';
import { FileDown, RotateCcw, Wand2, Copy } from 'lucide-react';

const LATEX_KEY   = 'cp_resume_latex_v1';
const STORAGE_KEY = 'cp_resume_builder_v2';
const PAGE_W = 816;   // 8.5 in × 96 dpi — exact US Letter
const PAGE_H = 1056;  // 11 in × 96 dpi
function uid() { return Math.random().toString(36).slice(2, 9); }

const DEFAULT = {
  personal: { name: '', phone: '', email: '', linkedin: '', github: '' },
  education: [{ id: uid(), school: '', location: '', degree: '', gpa: '', dates: '', coursework: '' }],
  experience: [{ id: uid(), company: '', location: '', role: '', dates: '', bullets: '' }],
  projects:   [{ id: uid(), name: '', tech: '', link: '', dates: '', bullets: '' }],
  skills: [],
};

const SAMPLE = {
  personal: {
    name: 'Jake Ryan',
    phone: '(512) 555-0147',
    email: 'jake@example.com',
    linkedin: 'linkedin.com/in/jakeryan',
    github: 'github.com/jakeryan',
  },
  education: [{
    id: uid(), school: 'Southwestern University', location: 'Georgetown, TX',
    degree: 'B.S. Computer Science', gpa: '3.8/4.0',
    dates: 'Aug 2018 -- May 2021',
    coursework: 'Data Structures, Algorithms, Operating Systems, Computer Networks, Databases',
  }],
  experience: [
    {
      id: uid(), company: 'Amazon', location: 'Seattle, WA',
      role: 'Software Development Engineer', dates: 'Jul 2021 -- Present',
      bullets: 'Designed a fault-tolerant event pipeline on AWS ECS + SQS that processes over 2 million events per day with 99.95% uptime\nReduced p99 API latency by 38% by decomposing a monolithic service into independently-deployable microservices\nLed a 4-engineer team to ship a customer-facing analytics dashboard 2 weeks ahead of schedule, earning a team commendation\nImproved CI/CD pipeline throughput by 45% by parallelising test suites and caching Docker layers in CodeBuild',
    },
    {
      id: uid(), company: 'Texas Instruments', location: 'Austin, TX',
      role: 'Software Engineer Intern', dates: 'May 2020 -- Aug 2020',
      bullets: 'Built a REST API with Node.js and PostgreSQL that consolidated data from 3 legacy systems and served 3 internal product teams\nCut report generation time by 55% by rewriting N+1 SQL queries with indexed joins and query-result caching in Redis\nCollaborated with 5 engineers across 2 time zones and delivered all sprint goals on time using Agile/Scrum',
    },
    {
      id: uid(), company: 'Bluehost', location: 'Austin, TX',
      role: 'Software Developer Intern', dates: 'Jan 2020 -- Apr 2020',
      bullets: 'Built a real-time React dashboard to visualise server uptime and alert thresholds across a fleet of 200+ nodes\nAutomated a nightly ETL data-sync job with Python and Apache Airflow, saving 4 hours of manual work per week\nAchieved 87% unit and integration test coverage using Jest and Pytest, reducing production bug rate by 30%',
    },
  ],
  projects: [
    {
      id: uid(), name: 'Gitlytics', tech: 'Python, Flask, React, PostgreSQL, GitHub OAuth',
      link: '', dates: 'Jun 2021',
      bullets: 'Built a GitHub analytics platform visualising commit frequency, PR cycle time, and code-review load across engineering teams\nImplemented OAuth 2.0 login, GitHub webhook ingestion, and Redis caching, reducing GitHub API calls by 70% and page load time by half\nDeployed on AWS EC2 behind an Nginx reverse proxy with automated Let\'s Encrypt SSL renewal via Certbot',
    },
    {
      id: uid(), name: 'Simple Shell', tech: 'C, Linux', link: '', dates: 'Mar 2021',
      bullets: 'Implemented a POSIX-compliant Unix shell supporting piping, I/O redirection, background job control, and signal handling in C\nDesigned a custom tokenizer and recursive-descent parser capable of handling nested subshells, quoted strings, and escape sequences\nAchieved full correctness on 120 test cases including edge cases for heredoc, process substitution, and wildcard glob expansion',
    },
    {
      id: uid(), name: 'Stock Screener', tech: 'Python, FastAPI, React, PostgreSQL, Pandas', link: '', dates: 'Dec 2020',
      bullets: 'Scraped and normalised 5 years of OHLCV data for 500+ tickers using yfinance and stored in a partitioned PostgreSQL schema\nBuilt a FastAPI backend with computed technical indicators (RSI, MACD, Bollinger Bands) and a filterable React screener UI\nContainerised the full stack with Docker Compose and deployed to a DigitalOcean droplet with a nightly data-refresh cron job',
    },
  ],
  skills: [
    { id: uid(), category: 'Languages', value: 'Python, TypeScript, JavaScript, Go, C, SQL, Bash' },
    { id: uid(), category: 'Frameworks', value: 'React, Node.js, Express, Flask, FastAPI, Tailwind CSS, Spring Boot' },
    { id: uid(), category: 'Developer Tools', value: 'Git, Docker, Kubernetes, AWS (EC2, S3, ECS, RDS, Lambda), PostgreSQL, Redis, Linux' },
    { id: uid(), category: 'Libraries', value: 'pandas, NumPy, SQLAlchemy, Prisma, React Query, Jest, Pytest, Apache Airflow' },
  ],
};

/* ── LaTeX escape helpers ── */
function esc(s = '') {
  return s
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&').replace(/%/g, '\\%').replace(/\$/g, '\\$')
    .replace(/#/g, '\\#').replace(/_/g, '\\_')
    .replace(/\{/g, '\\{').replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');
}
function escBullet(s = '') {
  return s.replace(/&/g, '\\&').replace(/%/g, '\\%').replace(/#/g, '\\#');
}

/* ── LaTeX → HTML for preview (safe self-use context) ── */
function latexToHtml(s = '') {
  if (!s) return '';
  return s
    .replace(/\\&/g, '&amp;').replace(/\\%/g, '%').replace(/\\\$/g, '$')
    .replace(/\\#/g, '#').replace(/\\_/g, '_')
    .replace(/--/g, '–')
    .replace(/\$\|\$/g, ' | ')
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')
    .replace(/\\href\{[^}]+\}\{[^}]*\}/g, '')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+\s*/g, '')
    .replace(/\{([^}]*)\}/g, '$1')
    .trim();
}

/* ── LaTeX generation (Meshwa's template) ── */
function generateLatex(data) {
  const p = data.personal;
  const ln = p.linkedin || '';
  const gh = p.github   || '';
  const liHref = ln.startsWith('http') ? ln : (ln ? `https://linkedin.com/in/${ln.replace(/^.*in\//, '')}` : '');
  const ghHref = gh.startsWith('http') ? gh : (gh ? `https://github.com/${gh.replace(/^.*github\.com\//, '')}` : '');

  const contactParts = [
    p.phone    ? `\\faPhone\\ ${esc(p.phone)}` : null,
    p.email    ? `\\href{mailto:${p.email}}{\\faEnvelope\\ \\underline{${esc(p.email)}}}` : null,
    liHref     ? `\\href{${liHref}}{\\faLinkedin\\ \\underline{LinkedIn}}` : null,
    ghHref     ? `\\href{${ghHref}}{\\faGithub\\ \\underline{GitHub}}` : null,
  ].filter(Boolean);

  const eduSection = !data.education.length ? '' : `
%-----------EDUCATION-----------
\\section{Education}
\\resumeSubHeadingListStart
${data.education.map(e => `  \\resumeSubheading
    {${esc(e.school)}}{${esc(e.dates)}}
    {${esc(e.degree)}${e.gpa ? ` $|$ GPA: ${esc(e.gpa)}` : ''}}{${esc(e.location)}}${e.coursework ? `\n    \\resumeItemListStart\n      \\resumeItem{\\textbf{Coursework:} ${escBullet(e.coursework)}}\n    \\resumeItemListEnd` : ''}`).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-14pt}`;

  const expSection = !data.experience.length ? '' : `

%-----------EXPERIENCE-----------
\\section{Experience}
\\resumeSubHeadingListStart
${data.experience.map(e => {
    const bullets = (e.bullets||'').split('\n').map(l=>l.trim().replace(/^[-•▸]\s*/,'')).filter(Boolean);
    return `  \\resumeSubheading
    {${esc(e.company)}}{${esc(e.dates)}}
    {${escBullet(e.role)}}{${esc(e.location)}}${bullets.length ? `\n    \\resumeItemListStart\n${bullets.map(b=>`      \\resumeItem{${escBullet(b)}}`).join('\n')}\n    \\resumeItemListEnd` : ''}`;
  }).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-10pt}`;

  const projSection = !data.projects.length ? '' : `

%-----------PROJECTS-----------
\\section{Projects}
\\resumeSubHeadingListStart
${data.projects.map(pr => {
    const bullets = (pr.bullets||'').split('\n').map(l=>l.trim().replace(/^[-•▸]\s*/,'')).filter(Boolean);
    const parts = [
      `\\textbf{${esc(pr.name)}}`,
      pr.tech ? `\\emph{${esc(pr.tech)}}` : null,
      pr.link ? `\\href{${pr.link}}{\\underline{GitHub}}` : null,
    ].filter(Boolean);
    return `  \\resumeProjectHeading
    {${parts.join(' $|$ ')}}{}${bullets.length ? `\n    \\resumeItemListStart\n${bullets.map(b=>`      \\resumeItem{${escBullet(b)}}`).join('\n')}\n    \\resumeItemListEnd` : ''}`;
  }).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-12pt}`;

  const skillSection = !data.skills.length ? '' : `

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=0pt]
\\footnotesize{\\item{
${data.skills.map(sk => `\\textbf{${esc(sk.category)}:} ${escBullet(sk.value)} \\\\`).join('\n')}
}}
\\end{itemize}`;

  return `%-------------------------
% Resume in Latex
%------------------------

\\documentclass[letterpaper,10pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.80in}
\\addtolength{\\textheight}{1.75in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-5pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{#1 \\vspace{-2pt}}}
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.15in]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

%----------HEADING----------
\\begin{center}
    {\\Huge \\scshape ${esc(p.name || 'Your Name')}} \\\\ \\vspace{1pt}
    \\small
    ${contactParts.join(' ~\n    ')}
    \\vspace{-8pt}
\\end{center}
${eduSection}${expSection}${projSection}${skillSection}

\\end{document}
`;
}

/* ── Brace-balanced extractors ── */
function extractArgs(s, n) {
  const args = [];
  let i = 0;
  for (let a = 0; a < n; a++) {
    while (i < s.length && s[i] !== '{') i++;
    if (i >= s.length) return null;
    i++;
    let depth = 1, start = i;
    while (i < s.length && depth > 0) {
      if (s[i] === '\\') { i += 2; continue; }
      if (s[i] === '{') depth++;
      else if (s[i] === '}') depth--;
      if (depth > 0) i++;
    }
    args.push(s.slice(start, i));
    i++;
  }
  return args.length === n ? args : null;
}

function extractItems(s) {
  const items = [];
  const re = /\\resumeItem\{/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    let depth = 1, i = m.index + m[0].length, start = i;
    while (i < s.length && depth > 0) {
      if (s[i] === '\\') { i += 2; continue; }
      if (s[i] === '{') depth++;
      else if (s[i] === '}') depth--;
      if (depth > 0) i++;
    }
    items.push(s.slice(start, i));
  }
  return items;
}

/* ── Full LaTeX parser ── */
function parseLatex(tex) {
  const unesc = (s = '') => s
    .replace(/\\&/g, '&').replace(/\\%/g, '%').replace(/\\\$/g, '$')
    .replace(/\\#/g, '#').replace(/\\_/g, '_')
    .replace(/\\{/g, '{').replace(/\\}/g, '}')
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\textasciitilde\{\}/g, '~').replace(/\\textasciicircum\{\}/g, '^')
    .trim();

  // Name: handle {\Huge \scshape NAME} and \textbf{\Huge \scshape NAME}
  const nameM =
    tex.match(/\\textbf\{\\Huge \\scshape ([^\\}][^}]*)\}/) ||
    tex.match(/\{\\Huge \\scshape ([^}]+)\}/);
  const name = nameM ? unesc(nameM[1].trim()) : '';

  // Contact
  let phone = '', email = '', linkedin = '', github = '';
  const centerM = tex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  if (centerM) {
    const raw = centerM[1]
      .replace(/\{?\\Huge[^}]*\}[^\\]*\\\\\s*\\vspace\{[^}]+\}/g, '')
      .replace(/\\small\s*/g, '')
      .replace(/\\vspace\{[^}]+\}/g, '');

    for (const part of raw.split(/\s*~\s*|\s*\$\|\$\s*/)) {
      const p = part.trim();
      if (!p) continue;
      const hrefM = p.match(/\\href\{([^}]+)\}/);
      if (hrefM) {
        const url = hrefM[1];
        if (url.includes('mailto:'))          email    = url.replace('mailto:', '').trim();
        else if (/linkedin/i.test(url))        linkedin = url;
        else if (/github/i.test(url))          github   = url;
        continue;
      }
      const stripped = p
        .replace(/\\fa[A-Za-z]+\\\s*/g, '')
        .replace(/\\fa[A-Za-z]+\s*/g, '')
        .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
        .replace(/\\[a-zA-Z]+\s*/g, '')
        .trim();
      if (/^[+\d][\d\s().+-]+$/.test(stripped)) phone = stripped;
    }
  }

  const looksLikeDate = s => /\d{4}|present|current/i.test(s);

  // Education
  const eduSec = tex.match(/\\section\{Education\}([\s\S]*?)(?=\\section\{|\\end\{document\})/)?.[1] ?? '';
  const education = eduSec.split(/\\resumeSubheading/).slice(1).flatMap(block => {
    const args = extractArgs(block, 4);
    if (!args) return [];
    const [a1, a2, a3, a4] = args;
    const useDateOrder = looksLikeDate(a2);
    const school = a1;
    const dates  = useDateOrder ? a2 : a4;
    const loc    = useDateOrder ? a4 : a2;
    const degRaw = a3;
    const gpaM   = degRaw.match(/(?:--|\\?\$\|\\?\$)\s*GPA:\s*([^\s,\\$]+(?:\/[^\s,\\$]+)?)/);
    const degree = degRaw.replace(/\s*(?:--|\\?\$\|\\?\$)\s*GPA:.+$/, '').trim();
    const cwM    = block.match(/(?:Relevant\s+)?Coursework:\s*([^}\\]+)/);
    return [{ id: uid(), school: unesc(school), location: unesc(loc),
      degree: unesc(degree), gpa: unesc(gpaM?.[1] ?? ''),
      dates: unesc(dates), coursework: cwM ? unesc(cwM[1]).trim() : '' }];
  });

  // Experience
  const expSec = tex.match(/\\section\{Experience\}([\s\S]*?)(?=\\section\{|\\end\{document\})/)?.[1] ?? '';
  const experience = expSec.split(/\\resumeSubheading/).slice(1).flatMap(block => {
    const args = extractArgs(block, 4);
    if (!args) return [];
    const [a1, a2, a3, a4] = args;
    const useDateOrder = looksLikeDate(a2);
    return [{ id: uid(),
      company:  unesc(a1),
      dates:    unesc(useDateOrder ? a2 : a4),
      role:     unesc(a3),
      location: unesc(useDateOrder ? a4 : a2),
      bullets:  extractItems(block).map(b => unesc(b)).join('\n') }];
  });

  // Projects
  const projSec = tex.match(/\\section\{Projects\}([\s\S]*?)(?=\\section\{|\\end\{document\})/)?.[1] ?? '';
  const projects = projSec.split(/\\resumeProjectHeading/).slice(1).flatMap(block => {
    const args = extractArgs(block, 2);
    if (!args) return [];
    const [heading, dates] = args;
    const parts = heading.split(/\s*\$\|\$\s*/);
    const nameM2 = parts[0]?.match(/\\textbf\{([^}]+)\}/);
    const techM  = parts[1]?.match(/\\emph\{([^}]+)\}/);
    const linkPart = parts.find(p => p.includes('\\href')) ?? '';
    const linkM  = linkPart.match(/\\href\{([^}]+)\}/);
    return [{ id: uid(),
      name:  nameM2 ? unesc(nameM2[1]) : unesc(parts[0] ?? ''),
      tech:  techM  ? unesc(techM[1])  : '',
      link:  linkM  ? linkM[1]         : '',
      dates: unesc(dates),
      bullets: extractItems(block).map(b => unesc(b)).join('\n') }];
  });

  // Skills — handles both \textbf{Cat:} value \\ and \textbf{Cat}{: value}
  const skSec = tex.match(/\\section\{(?:Technical\s+)?Skills\}([\s\S]*?)(?=\\section\{|\\end\{document\})/)?.[1] ?? '';
  const skills = [];
  const re1 = /\\textbf\{([^}]+):\}\s*([^\\\n]+)/g;
  let m;
  while ((m = re1.exec(skSec)) !== null) {
    const val = m[2].replace(/\s*\\\\$/, '').trim();
    if (val) skills.push({ id: uid(), category: unesc(m[1].trim()), value: unesc(val) });
  }
  if (!skills.length) {
    const re2 = /\\textbf\{([^}]+)\}\{:\s*([^}\\]+)/g;
    while ((m = re2.exec(skSec)) !== null) {
      skills.push({ id: uid(), category: unesc(m[1].trim()), value: unesc(m[2].trim()) });
    }
  }

  return {
    personal: { name, email, phone, linkedin, github },
    education:  education.length  ? education  : DEFAULT.education.map(e => ({ ...e, id: uid() })),
    experience: experience.length ? experience : DEFAULT.experience.map(e => ({ ...e, id: uid() })),
    projects:   projects.length   ? projects   : DEFAULT.projects.map(p => ({ ...p, id: uid() })),
    skills,
  };
}

/* ── Contact icons (inline SVG — survive innerHTML serialization for PDF export) ── */
const IC = ({ d, size = 11 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
    style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', marginRight: 3, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const PhoneIcon    = () => <IC d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.29 21 3 13.71 3 4.5c0-.55.45-1 1-1H7.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.01L6.6 10.8z" />;
const EmailIcon    = () => <IC d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />;
const LinkedInIcon = () => <IC d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />;
const GitHubIcon   = () => <IC d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />;

/* ── Preview components ── */
function Ghost({ text }) {
  return <span style={{ color: '#bbb', fontStyle: 'italic' }}>{text}</span>;
}

function JSection({ title, children }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{
        fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase',
        letterSpacing: '0.03em', borderBottom: '1px solid #000',
        paddingBottom: '1px', marginBottom: '3px',
        marginTop: '2px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function TwoRow({ topLeft, topRight, botLeft, botRight }) {
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', lineHeight: '1.2' };
  return (
    <div style={{ marginBottom: '1px' }}>
      <div style={row}>
        <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>{topLeft}</span>
        {topRight && <span style={{ fontWeight: 'bold', fontSize: '9pt', flexShrink: 0, marginLeft: '8px' }}>{topRight}</span>}
      </div>
      <div style={row}>
        <span style={{ fontStyle: 'italic', fontSize: '9pt' }}>{botLeft}</span>
        {botRight && <span style={{ fontStyle: 'italic', fontSize: '9pt', flexShrink: 0, marginLeft: '8px' }}>{botRight}</span>}
      </div>
    </div>
  );
}

function Bullets({ text }) {
  if (!text?.trim()) return null;
  const lines = text.split('\n').map(l => l.trim().replace(/^[-•▸]\s*/, '')).filter(Boolean);
  return (
    <ul style={{ margin: '1px 0 0 14px', padding: 0, listStyleType: 'disc' }}>
      {lines.map((line, i) => (
        <li key={i} style={{ fontSize: '9pt', marginBottom: '0.5px', lineHeight: '1.25' }}
          dangerouslySetInnerHTML={{ __html: latexToHtml(line) }} />
      ))}
    </ul>
  );
}

/* ── Resume content (no height clip — used for both preview & measurement) ── */
function ResumeContent({ data }) {
  const p = data.personal;
  const liLabel = p.linkedin
    ? (p.linkedin.includes('linkedin.com') ? 'LinkedIn' : p.linkedin) : '';
  const ghLabel = p.github
    ? (p.github.includes('github.com') ? 'GitHub' : p.github) : '';

  const linkStyle = { color: '#1155CC', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 2 };
  const contacts = [
    p.phone  && <span key="ph" style={{ display: 'inline-flex', alignItems: 'center' }}><PhoneIcon />{p.phone}</span>,
    p.email  && <a key="em" href={`mailto:${p.email}`} style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}><EmailIcon />{p.email}</a>,
    liLabel  && <a key="li" href={p.linkedin.startsWith('http') ? p.linkedin : `https://linkedin.com/in/${p.linkedin}`} target="_blank" rel="noreferrer" style={linkStyle}><LinkedInIcon />LinkedIn</a>,
    ghLabel  && <a key="gh" href={p.github.startsWith('http') ? p.github : `https://github.com/${p.github}`} target="_blank" rel="noreferrer" style={linkStyle}><GitHubIcon />GitHub</a>,
  ].filter(Boolean);

  const hasEdu  = data.education.some(e => e.school);
  const hasExp  = data.experience.some(e => e.company);
  const hasProj = data.projects.some(pr => pr.name);
  const hasSk   = data.skills.length > 0;

  return (
    <div style={{
      width: PAGE_W, background: '#fff',
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '10pt', lineHeight: '1.25', color: '#000',
      padding: '19px 48px 19px 38px', boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1px' }}>
        <span style={{ fontSize: '22pt', fontWeight: 'bold', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {p.name || <Ghost text="YOUR NAME" />}
        </span>
      </div>
      <div style={{ textAlign: 'center', fontSize: '9pt', marginBottom: '6px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px', color: '#222' }}>
        {contacts.length ? contacts : (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#bbb', fontStyle: 'italic' }}><PhoneIcon />phone</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#bbb', fontStyle: 'italic' }}><EmailIcon />email</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#bbb', fontStyle: 'italic' }}><LinkedInIcon />LinkedIn</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#bbb', fontStyle: 'italic' }}><GitHubIcon />GitHub</span>
          </>
        )}
      </div>

      {hasEdu && (
        <JSection title="Education">
          {data.education.map(e => (
            <div key={e.id} style={{ marginBottom: '2px' }}>
              <TwoRow
                topLeft={e.school}
                topRight={e.dates ? e.dates.replace(/--/g, '–') : ''}
                botLeft={<span>{e.degree}{e.gpa ? <span style={{ fontStyle: 'normal' }}> | GPA: {e.gpa}</span> : ''}</span>}
                botRight={e.location}
              />
              {e.coursework && (
                <div style={{ fontSize: '9pt', marginTop: '1px', marginLeft: '2px', lineHeight: '1.25' }}>
                  <span>• <strong>Coursework:</strong> {e.coursework}</span>
                </div>
              )}
            </div>
          ))}
        </JSection>
      )}

      {hasExp && (
        <JSection title="Experience">
          {data.experience.map(e => (
            <div key={e.id} style={{ marginBottom: '2px' }}>
              <TwoRow
                topLeft={e.company}
                topRight={e.dates ? e.dates.replace(/--/g, '–') : ''}
                botLeft={<span dangerouslySetInnerHTML={{ __html: latexToHtml(e.role) }} />}
                botRight={e.location}
              />
              <Bullets text={e.bullets} />
            </div>
          ))}
        </JSection>
      )}

      {hasProj && (
        <JSection title="Projects">
          {data.projects.map(pr => (
            <div key={pr.id} style={{ marginBottom: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '9pt', lineHeight: '1.2' }}>
                <span>
                  <strong>{pr.name.replace(/--/g, '–')}</strong>
                  {pr.tech && <span> | <em>{pr.tech}</em></span>}
                  {pr.link && <span> | <a href={pr.link} target="_blank" rel="noreferrer" style={{ color: '#1155CC', textDecoration: 'underline' }}>GitHub</a></span>}
                </span>
                {pr.dates && <span style={{ fontWeight: 'bold', fontSize: '9pt', flexShrink: 0, marginLeft: '6px' }}>{pr.dates}</span>}
              </div>
              <Bullets text={pr.bullets} />
            </div>
          ))}
        </JSection>
      )}

      {hasSk && (
        <JSection title="Technical Skills">
          {data.skills.map(sk => (
            <div key={sk.id} style={{ fontSize: '9pt', marginBottom: '1px', lineHeight: '1.25' }}>
              <strong>{sk.category}:</strong> {sk.value}
            </div>
          ))}
        </JSection>
      )}

      {!hasEdu && !hasExp && !hasProj && !hasSk && (
        <div style={{ color: '#ccc', fontStyle: 'italic', textAlign: 'center', marginTop: 40, fontSize: '10pt' }}>
          Paste your LaTeX on the left — preview appears here
        </div>
      )}
    </div>
  );
}

function JakePage({ data }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, overflow: 'hidden' }}>
      <ResumeContent data={data} />
    </div>
  );
}

const PAGE_GAP = 16; // px gap between pages (unscaled)

/* ── Scaled preview with multi-page support ── */
function ScaledPreview({ data }) {
  const wrapperRef = useRef(null);
  const measureRef = useRef(null);
  const [scale, setScale]         = useState(1);
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    function resize() {
      if (!wrapperRef.current) return;
      setScale(Math.min(1, (wrapperRef.current.clientWidth - 32) / PAGE_W));
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (measureRef.current) {
      const h = measureRef.current.offsetHeight;
      setPageCount(Math.max(1, Math.ceil(h / PAGE_H)));
    }
  }, [data]);

  const overLimit = pageCount > 1;
  // Total height of all scaled pages + gaps between them
  const stackHeight = pageCount * PAGE_H * scale + (pageCount - 1) * PAGE_GAP;

  return (
    <div ref={wrapperRef} className="flex flex-1 flex-col items-center overflow-y-auto py-5 px-4"
      style={{ background: '#e8eaed', position: 'relative' }}>

      {/* Off-screen measurement clone (unconstrained height) */}
      <div ref={measureRef} style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <ResumeContent data={data} />
      </div>

      {/* Page count badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 11 }}>
        <span style={{ color: '#555' }}>Pages</span>
        <span style={{
          background: overLimit ? '#dc2626' : '#374151',
          color: '#fff', borderRadius: 4, padding: '1px 8px', fontWeight: 700, fontSize: 11,
        }}>
          {pageCount}
        </span>
        {overLimit && (
          <span style={{ color: '#dc2626', fontSize: 10, fontWeight: 600 }}>
            ⚠ Resume exceeds 1 page
          </span>
        )}
      </div>

      {/* All pages stacked */}
      <div style={{ width: PAGE_W * scale, height: stackHeight, position: 'relative', flexShrink: 0 }}>
        {Array.from({ length: pageCount }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: i * (PAGE_H * scale + PAGE_GAP),
            left: 0,
            width: PAGE_W * scale,
            height: PAGE_H * scale,
          }}>
            {/* Page N label */}
            {pageCount > 1 && (
              <div style={{ position: 'absolute', top: -16, left: 0, fontSize: 9, color: '#888', userSelect: 'none' }}>
                Page {i + 1}
              </div>
            )}
            {/* Scaled page shell */}
            <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: 'top left', transform: `scale(${scale})` }}>
              <div style={{ width: PAGE_W, height: PAGE_H, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
                {/* Shift content up so page N shows the correct slice */}
                <div style={{ transform: `translateY(${-i * PAGE_H}px)` }}>
                  <ResumeContent data={data} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 12, fontSize: 10, color: '#888', textAlign: 'center' }}>
        Letter · 8.5 × 11 in · {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </p>
    </div>
  );
}

/* ── LaTeX editor with line numbers ── */
function CodeEditor({ value, onChange }) {
  const taRef  = useRef(null);
  const numRef = useRef(null);
  const lines  = value.split('\n');
  const digits = String(lines.length).length;

  function syncScroll() {
    if (numRef.current && taRef.current) {
      numRef.current.scrollTop = taRef.current.scrollTop;
    }
  }

  const monoStyle = {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
    fontSize: '11.5px',
    lineHeight: '1.7',
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Line numbers */}
      <div
        ref={numRef}
        style={{
          ...monoStyle,
          background: '#181825',
          color: '#45475a',
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingRight: '10px',
          paddingLeft: '8px',
          textAlign: 'right',
          userSelect: 'none',
          overflowY: 'hidden',
          overflowX: 'hidden',
          width: `${digits * 9 + 20}px`,
          flexShrink: 0,
          borderRight: '1px solid #313244',
        }}
      >
        {lines.map((_, i) => (
          <div key={i} style={{ lineHeight: '1.7' }}>{i + 1}</div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          ...monoStyle,
          flex: 1,
          background: '#1e1e2e',
          color: '#cdd6f4',
          caretColor: '#cba6f7',
          padding: '16px 20px',
          outline: 'none',
          resize: 'none',
          border: 'none',
          overflow: 'auto',
          tabSize: 2,
        }}
      />
    </div>
  );
}

/* ── Initial LaTeX loader (with legacy migration) ── */
function loadInitialLatex() {
  try {
    const saved = localStorage.getItem(LATEX_KEY);
    if (saved) return saved;
    const old = localStorage.getItem(STORAGE_KEY);
    if (old) return generateLatex(JSON.parse(old));
  } catch {}
  return generateLatex(DEFAULT);
}

/* ── Main page ── */
export default function ResumeBuilderPage() {
  const initial = loadInitialLatex();
  const [latexCode, setLatexCode]     = useState(initial);
  const [previewData, setPreviewData] = useState(() => parseLatex(initial));
  const [copied, setCopied]           = useState(false);

  function handleChange(e) {
    const code = e.target.value;
    setLatexCode(code);
    localStorage.setItem(LATEX_KEY, code);
    setPreviewData(parseLatex(code));
  }

  function loadSample() {
    if (!confirm('Load sample data? This will replace your current LaTeX.')) return;
    const code = generateLatex(SAMPLE);
    setLatexCode(code); setPreviewData(SAMPLE);
    localStorage.setItem(LATEX_KEY, code);
  }

  function resetAll() {
    if (!confirm('Clear everything and start fresh?')) return;
    const code = generateLatex(DEFAULT);
    setLatexCode(code); setPreviewData(DEFAULT);
    localStorage.setItem(LATEX_KEY, code);
  }

  function copyLatex() {
    navigator.clipboard.writeText(latexCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function exportPDF() {
    const el = document.getElementById('rp-print');
    if (!el) return;

    // Hidden iframe — no new tab, print dialog appears in place
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:816px;height:1056px;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Resume</title>
      <style>
        @page { margin: 0; size: 8.5in 11in portrait; }
        html, body { margin: 0; padding: 0; background: #fff; }
        * { box-sizing: border-box; }
        a { color: #1155CC; }
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    doc.close();

    // Wait for iframe to render, then print
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Remove iframe after the dialog is done
      setTimeout(() => document.body.contains(iframe) && document.body.removeChild(iframe), 2000);
    }, 300);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Hidden resume clone used only for PDF export */}
      <div id="rp-print" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none', visibility: 'hidden' }} aria-hidden="true">
        <ResumeContent data={previewData} />
      </div>

      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Resume Builder</h1>
          <p className="text-[11px] text-slate-400">Edit LaTeX · live preview · auto-saved</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSample} className="flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition">
            <Wand2 className="h-3 w-3" /> Load Sample
          </button>
<button onClick={resetAll} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm">
            <FileDown className="h-3 w-3" /> Export PDF
          </button>
        </div>
      </div>

      {/* Split: editor | preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — LaTeX editor */}
        <div className="w-1/2 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: '#1e1e2e' }}>
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ background: '#181825', borderBottom: '1px solid #313244' }}>
            <span className="text-[10px] font-mono font-semibold px-3 py-1 rounded" style={{ background: '#1e1e2e', color: '#cba6f7', border: '1px solid #313244' }}>
              main.tex
            </span>
            <button
              onClick={copyLatex}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition"
              style={{ background: '#313244', color: copied ? '#a6e3a1' : '#cdd6f4', border: '1px solid #45475a' }}
            >
              <Copy style={{ width: 10, height: 10 }} /> {copied ? 'Copied!' : 'Copy LaTeX'}
            </button>
          </div>
          <CodeEditor value={latexCode} onChange={handleChange} />
        </div>

        {/* Right — live preview */}
        <ScaledPreview data={previewData} />
      </div>
    </div>
  );
}

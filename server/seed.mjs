import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_ID = '8196a731-9269-4368-9409-858c259eea0f';

async function main() {
  console.log('Clearing existing data for user...');
  await prisma.contact.deleteMany({ where: { userId: USER_ID } });
  await prisma.interview.deleteMany({ where: { application: { userId: USER_ID } } });
  await prisma.notification.deleteMany({ where: { userId: USER_ID } });
  await prisma.aiRequest.deleteMany({ where: { userId: USER_ID } });
  await prisma.application.deleteMany({ where: { userId: USER_ID } });

  console.log('Seeding applications...');

  const apps = await Promise.all([
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Google',
        roleTitle: 'Senior Software Engineer',
        status: 'interview',
        appliedAt: new Date('2026-05-10'),
        jobUrl: 'https://careers.google.com',
        source: 'Company Website',
        notes: 'L5 IC role. Referred by ex-colleague from university. Strong team culture match.',
        followUpDate: new Date('2026-06-25'),
        salaryMin: 180000,
        salaryMax: 240000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Meta',
        roleTitle: 'Staff Frontend Engineer',
        status: 'offer',
        appliedAt: new Date('2026-04-22'),
        jobUrl: 'https://metacareers.com',
        source: 'LinkedIn',
        notes: 'E6 offer received. Competing with Google. Deadline to respond: July 1.',
        salaryMin: 210000,
        salaryMax: 280000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Stripe',
        roleTitle: 'Backend Engineer',
        status: 'screening',
        appliedAt: new Date('2026-05-28'),
        jobUrl: 'https://stripe.com/jobs',
        source: 'Referral',
        notes: 'Referred by Priya (current Stripe eng). Payments infra team. Very competitive.',
        followUpDate: new Date('2026-06-24'),
        salaryMin: 160000,
        salaryMax: 200000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Airbnb',
        roleTitle: 'Full Stack Engineer',
        status: 'applied',
        appliedAt: new Date('2026-06-01'),
        source: 'Company Website',
        notes: 'Growth eng team. Applied via referral portal.',
        salaryMin: 155000,
        salaryMax: 195000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Netflix',
        roleTitle: 'Senior Software Engineer',
        status: 'rejected',
        appliedAt: new Date('2026-04-05'),
        source: 'LinkedIn',
        notes: 'Got to final round. Feedback: needed stronger system design depth.',
        salaryMin: 200000,
        salaryMax: 700000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Spotify',
        roleTitle: 'Software Engineer II',
        status: 'applied',
        appliedAt: new Date('2026-06-10'),
        source: 'Job Board',
        notes: 'Personalisation & ML platform team. Interesting tech stack.',
        salaryMin: 145000,
        salaryMax: 175000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Uber',
        roleTitle: 'Platform Engineer',
        status: 'screening',
        appliedAt: new Date('2026-05-20'),
        source: 'Referral',
        notes: 'Core infrastructure. Golang heavy. Recruiter reached out on LinkedIn first.',
        followUpDate: new Date('2026-06-26'),
        salaryMin: 165000,
        salaryMax: 205000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'OpenAI',
        roleTitle: 'Software Engineer, Applied Research',
        status: 'applied',
        appliedAt: new Date('2026-06-15'),
        source: 'Company Website',
        notes: 'Long shot but worth trying. Applied for the Evals & Safety tooling team.',
        salaryMin: 180000,
        salaryMax: 300000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Figma',
        roleTitle: 'Senior Engineer, Editor',
        status: 'rejected',
        appliedAt: new Date('2026-03-18'),
        source: 'Company Website',
        notes: 'Rejected after OA. No feedback provided.',
        salaryMin: 160000,
        salaryMax: 220000,
      },
    }),
    prisma.application.create({
      data: {
        userId: USER_ID,
        company: 'Notion',
        roleTitle: 'Product Engineer',
        status: 'interview',
        appliedAt: new Date('2026-05-30'),
        source: 'LinkedIn',
        notes: 'Small but high-growth team. Great product culture. Founder interview scheduled.',
        followUpDate: new Date('2026-06-28'),
        salaryMin: 150000,
        salaryMax: 190000,
      },
    }),
  ]);

  const [google, meta, stripe, , , , uber, , , notion] = apps;

  console.log('Seeding interviews...');

  await Promise.all([
    // Google interviews
    prisma.interview.create({
      data: {
        applicationId: google.id,
        roundName: 'Recruiter Screen',
        format: 'phone',
        scheduledAt: new Date('2026-05-18T14:00:00Z'),
        durationMinutes: 30,
        interviewerName: 'Sarah Chen (Recruiter)',
        outcome: 'passed',
        notes: 'Good intro call. Discussed L5 expectations and team match.',
      },
    }),
    prisma.interview.create({
      data: {
        applicationId: google.id,
        roundName: 'Technical Round 1 — Coding',
        format: 'video',
        scheduledAt: new Date('2026-05-28T10:00:00Z'),
        durationMinutes: 60,
        interviewerName: 'Alex Rivera',
        outcome: 'passed',
        notes: 'Two LeetCode mediums. Solved both optimally. Interviewer was friendly.',
      },
    }),
    prisma.interview.create({
      data: {
        applicationId: google.id,
        roundName: 'Technical Round 2 — System Design',
        format: 'video',
        scheduledAt: new Date('2026-06-05T15:00:00Z'),
        durationMinutes: 60,
        interviewerName: 'Priya Nair',
        outcome: 'passed',
        notes: 'Designed a URL shortener with high availability. Strong feedback.',
      },
    }),
    prisma.interview.create({
      data: {
        applicationId: google.id,
        roundName: 'Hiring Committee Review',
        format: 'onsite',
        scheduledAt: new Date('2026-06-20T09:00:00Z'),
        durationMinutes: 240,
        outcome: 'pending',
        notes: 'Full day onsite. 4 rounds: coding x2, system design, behavioural.',
      },
    }),
    // Meta interviews
    prisma.interview.create({
      data: {
        applicationId: meta.id,
        roundName: 'Recruiter Call',
        format: 'phone',
        scheduledAt: new Date('2026-04-28T13:00:00Z'),
        durationMinutes: 45,
        interviewerName: 'Jordan Kim',
        outcome: 'passed',
        notes: 'Standard Meta recruiter screen. Discussed comp bands and teams.',
      },
    }),
    prisma.interview.create({
      data: {
        applicationId: meta.id,
        roundName: 'Technical Screen',
        format: 'video',
        scheduledAt: new Date('2026-05-07T11:00:00Z'),
        durationMinutes: 60,
        interviewerName: 'Daniel Wu',
        outcome: 'passed',
        notes: 'Product sense + React architecture questions. Went very well.',
      },
    }),
    prisma.interview.create({
      data: {
        applicationId: meta.id,
        roundName: 'Virtual Onsite (4 loops)',
        format: 'video',
        scheduledAt: new Date('2026-05-20T08:00:00Z'),
        durationMinutes: 300,
        outcome: 'passed',
        notes: 'Coding, system design, behavioural, reverse interview. Offer extended.',
      },
    }),
    // Uber
    prisma.interview.create({
      data: {
        applicationId: uber.id,
        roundName: 'Recruiter Intro',
        format: 'phone',
        scheduledAt: new Date('2026-05-27T16:00:00Z'),
        durationMinutes: 30,
        interviewerName: 'Emma Larson (Recruiter)',
        outcome: 'passed',
        notes: 'Brief intro. Discussed Golang experience and infra background.',
      },
    }),
    // Notion
    prisma.interview.create({
      data: {
        applicationId: notion.id,
        roundName: 'Hiring Manager Call',
        format: 'video',
        scheduledAt: new Date('2026-06-10T14:00:00Z'),
        durationMinutes: 45,
        interviewerName: 'Tom Park (Eng Manager)',
        outcome: 'passed',
        notes: 'Great culture chat. They want product-minded engineers.',
      },
    }),
    prisma.interview.create({
      data: {
        applicationId: notion.id,
        roundName: 'Technical Interview',
        format: 'video',
        scheduledAt: new Date('2026-06-30T10:00:00Z'),
        durationMinutes: 90,
        outcome: 'pending',
        notes: 'Scheduled. Prep: TypeScript, React, collaborative features.',
      },
    }),
  ]);

  console.log('Seeding contacts...');

  await Promise.all([
    // Google contacts
    prisma.contact.create({
      data: {
        userId: USER_ID,
        applicationId: google.id,
        name: 'Sarah Chen',
        roleTitle: 'Technical Recruiter',
        email: 'schen@google.com',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        notes: 'Main point of contact. Very responsive, replies within 24h.',
      },
    }),
    prisma.contact.create({
      data: {
        userId: USER_ID,
        applicationId: google.id,
        name: 'Alex Rivera',
        roleTitle: 'Senior Software Engineer (Interviewer)',
        linkedinUrl: 'https://linkedin.com/in/alexrivera',
        notes: 'Did the coding round. Seemed like a potential future teammate.',
      },
    }),
    // Meta contacts
    prisma.contact.create({
      data: {
        userId: USER_ID,
        applicationId: meta.id,
        name: 'Jordan Kim',
        roleTitle: 'University & Experienced Recruiter',
        email: 'jordankim@meta.com',
        phone: '+1 (650) 555-0182',
        notes: 'Offer deadline: July 1. Can request 1-week extension if needed.',
      },
    }),
    prisma.contact.create({
      data: {
        userId: USER_ID,
        applicationId: meta.id,
        name: 'Anika Patel',
        roleTitle: 'Engineering Manager, Web Infra',
        linkedinUrl: 'https://linkedin.com/in/anikapatel',
        notes: 'Would be direct manager. Discussed team roadmap during reverse interview.',
      },
    }),
    // Stripe contacts
    prisma.contact.create({
      data: {
        userId: USER_ID,
        applicationId: stripe.id,
        name: 'Priya Sharma',
        roleTitle: 'Software Engineer (Referral)',
        email: 'priya@stripe.com',
        linkedinUrl: 'https://linkedin.com/in/priyasharma',
        notes: 'Internal referral. Offered to put in a strong word with hiring team.',
      },
    }),
    // Uber contacts
    prisma.contact.create({
      data: {
        userId: USER_ID,
        applicationId: uber.id,
        name: 'Emma Larson',
        roleTitle: 'Technical Recruiter',
        email: 'elarson@uber.com',
        notes: 'Said technical screen will be scheduled within 2 weeks.',
      },
    }),
    // Notion contacts
    prisma.contact.create({
      data: {
        userId: USER_ID,
        applicationId: notion.id,
        name: 'Tom Park',
        roleTitle: 'Engineering Manager',
        linkedinUrl: 'https://linkedin.com/in/tompark',
        notes: 'Great vibe. Mentioned potential for early promotion if strong performance.',
      },
    }),
  ]);

  console.log('Seeding notifications...');

  await Promise.all([
    prisma.notification.create({
      data: {
        userId: USER_ID,
        type: 'follow_up_reminder',
        title: 'Follow-up reminder: Stripe',
        message: 'You set a follow-up for Stripe / Backend Engineer today. Consider sending a check-in email.',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: USER_ID,
        type: 'follow_up_reminder',
        title: 'Follow-up reminder: Uber',
        message: 'Follow-up due for Uber / Platform Engineer. Recruiter Emma Larson is your contact.',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: USER_ID,
        type: 'follow_up_reminder',
        title: 'Follow-up reminder: Notion',
        message: 'Technical interview at Notion is coming up on June 30. Start prep now.',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: USER_ID,
        type: 'system',
        title: 'Welcome to CareerPilot!',
        message: 'Your account is set up and ready. Add your first application to get started tracking your job search.',
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: USER_ID,
        type: 'system',
        title: 'AI Resume Review available',
        message: 'Upload a resume and get instant ATS score, missing keyword analysis, and section-by-section feedback.',
        isRead: true,
      },
    }),
  ]);

  console.log('Seeding AI usage records...');

  await Promise.all([
    prisma.aiRequest.create({
      data: {
        userId: USER_ID,
        feature: 'resume_review',
        tokensUsed: 2840,
        costUsd: 0.0284,
      },
    }),
    prisma.aiRequest.create({
      data: {
        userId: USER_ID,
        feature: 'cover_letter',
        tokensUsed: 1920,
        costUsd: 0.0192,
      },
    }),
    prisma.aiRequest.create({
      data: {
        userId: USER_ID,
        feature: 'resume_review',
        tokensUsed: 3100,
        costUsd: 0.031,
      },
    }),
  ]);

  console.log('\nSeed complete!');
  console.log('  10 applications (applied/screening/interview/offer/rejected)');
  console.log('  10 interviews across Google, Meta, Uber, Notion');
  console.log('   7 contacts across 6 companies');
  console.log('   5 notifications (3 unread)');
  console.log('   3 AI usage records');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

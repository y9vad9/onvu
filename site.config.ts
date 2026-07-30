import type { SiteConfig } from '@config/site'

export const config: SiteConfig = {
  owner: {
    name: 'Alex Rivers',
    handle: 'alexrivers',
    profileImage: '/profile.svg',
    bio: 'Software engineer, open-source contributor, and lifelong learner. I write about software design, Kotlin, and building things that last.',
    socials: [
      { platform: 'github', url: 'https://github.com' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
      { platform: 'twitter', url: 'https://twitter.com' },
      // Any platform name is accepted. For unknown names — or to override
      // the default icon — pass `icon` as a PascalCase lucide name from
      // https://lucide.dev/icons (e.g. `icon: 'Github'`):
      // { platform: 'mastodon', url: 'https://mastodon.social/@you', icon: 'AtSign' },
    ],
  },

  // Optional brand mark for the header. Omit to use `owner.handle` as text.
  // branding: { kind: 'text', text: 'My Site' },
  // branding: { kind: 'image', src: '/logo.svg', alt: 'My Site', width: 28, height: 28 },

  // Optional theme list. Omit for the five framework defaults (light, dark,
  // warm, forest, system). Add/remove/reorder freely; each `id` must match
  // a `.theme-<id>` rule in `content/theme.css` (or `globals.css`).
  // themes: [
  //   { id: 'light', label: 'light', icon: 'Sun' },
  //   { id: 'dark',  label: 'dark',  icon: 'Moon' },
  //   { id: 'ocean', label: 'ocean', icon: 'Waves' },
  //   { id: 'system', label: 'system', icon: 'Monitor' },
  // ],

  locales: {
    primary: 'en',
    supported: ['en', 'de', 'uk'],
  },

  defaultTheme: 'system',
  mode: 'static',

  pwa: {
    name: 'Alex Rivers',
    shortName: 'alexrivers',
    description: 'Personal portfolio and digital garden.',
  },

  navigation: {
    featuredNotes: ['deep-modules', 'kotlin-coroutines-intro', 'building-this-site'],
    workExperienceNote: 'work-experience',
    projectsNote: 'projects',
    educationNote: 'education',
    summaryNote: 'about',
  },

  home: {
    workExperience: [
      {
        company: 'Acme Corp',
        role: 'Senior Software Engineer',
        period: '2022 – Present',
        url: 'https://example.com',
        logo: '/logos/acme.svg',
      },
      {
        company: 'Startup XYZ',
        role: 'Backend Engineer',
        period: '2019 – 2022',
        url: 'https://example.com',
        logo: '/logos/startup.svg',
      },
    ],

    projects: [
      {
        name: 'Onvu',
        description: 'A personal portfolio and digital garden template for developers.',
        url: 'https://github.com',
      },
      {
        name: 'klib',
        description: 'A lightweight Kotlin utility library for coroutines and flow.',
        url: 'https://github.com',
      },
    ],

    education: [
      {
        institution: 'University of Technology',
        degree: 'B.Sc. Computer Science',
        period: '2015 – 2019',
        logo: '/logos/university.svg',
      },
    ],
  },

  // Comments. `provider: 'none'` (the default) renders no section at all.
  // Switch to `provider: 'giscus'` and fill in the keys from giscus.app to
  // enable per-note discussion threads backed by a GitHub Discussions repo.
  comments: { provider: 'none' },

  // SEO + structured data. Set `siteUrl` to your production origin so
  // canonical/OG URLs resolve, then fill the rest in as you go.
  seo: {
    siteUrl: 'https://example.com',
    // defaultOgImage: '/og/default.png',
    // twitterHandle: '@yourhandle',
    // organization: { name: 'Acme Inc', logo: '/logo.png' },
    // verification: { google: 'xxxx', bing: 'yyyy' },
    noindexPaths: ['/notes/graph'],
  },
  // comments: {
  //   provider: 'giscus',
  //   repo: 'yourusername/your-repo',
  //   repoId: 'R_xxxx',
  //   category: 'Announcements',
  //   categoryId: 'DIC_xxxx',
  // },

  // Machine-readable surfaces for AI agents. Entirely opt-in — leave this
  // block commented out and nothing below is generated or advertised.
  //
  // Set expectations first: Google states you "don't need to create new
  // machine readable files, AI text files, markup, or Markdown to appear in
  // Google Search", and that such files "neither harm nor help" because
  // Search ignores them. None of this is an SEO lever, and llms.txt in
  // particular is skipped by most AI crawlers today.
  //
  // What it does help: agents that fetch your page live — coding agents,
  // ChatGPT/Claude browsing, Perplexity-User. They pay tokens for your nav
  // chrome and get nothing from it; a markdown mirror is far cheaper to read.
  // See https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  //
  // agents: {
  //   markdown: {
  //     enabled: true,
  //     // [[Wiki Links]] → absolute URLs. On by default: an agent can't
  //     // follow [[deep-modules]], so an unresolved mirror is half a document.
  //     resolveWikilinks: true,
  //     include: {
  //       frontmatter: true,    // title, dates, tags, canonical URL
  //       series: true,         // "part N of X" + sibling links
  //       backlinks: true,      // notes linking here
  //       outgoing: true,       // links out of this note
  //       relatedNotes: true,   // notes sharing a parent
  //     },
  //   },
  //   llmsTxt: { enabled: true, full: false },
  //   discovery: {
  //     linkAlternate: true,    // <link rel="alternate" type="text/markdown">
  //     jsonLdEncoding: true,   // schema.org `encoding` → the mirror
  //     emitHeadersFile: false, // Netlify/Cloudflare Pages `_headers`
  //   },
  //   schema: {
  //     series: true,           // isPartOf CreativeWorkSeries + position
  //     mentions: true,         // mentions, from the wiki-link graph
  //     definedTerms: true,     // DefinedTerm / DefinedTermSet
  //     citations: true,        // citation, from outbound external links
  //     knowsAbout: true,       // Person.knowsAbout, from note tags
  //   },
  //
  //   // robots.txt policy for AI crawlers. Omit and robots.txt is unchanged.
  //   //
  //   // The three groups exist because "AI crawler" covers three jobs whose
  //   // costs differ, and you can't tell which is which from the name:
  //   //
  //   //   training      — feeds model training. Blocking costs you nothing
  //   //                   in any search product. (GPTBot, ClaudeBot,
  //   //                   Google-Extended, CCBot, …)
  //   //   aiSearch      — the retrieval index AI answers cite. Blocking
  //   //                   these is what removes you from AI answers.
  //   //                   (OAI-SearchBot, Claude-SearchBot, PerplexityBot, …)
  //   //   userTriggered — a fetch because someone just asked about your page.
  //   //                   OpenAI and Perplexity both document that these
  //   //                   largely ignore robots.txt, so treat a rule here as
  //   //                   a stated preference rather than a control.
  //   //
  //   // The common ask — "don't train on me, but do cite me" — is:
  //   crawlers: {
  //     training: 'block',
  //     aiSearch: 'allow',
  //     // Per-token escape hatch; keys need not be crawlers onvu knows about.
  //     // overrides: { CCBot: 'allow', 'SomeNewBot': 'block' },
  //   },
  // },
}

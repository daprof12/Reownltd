// Default content written to data/content.json on first run.
// Everything here is editable from the CMS at /admin.
// NOTE: stats, portfolio and testimonials are SAMPLE content — replace with real data before launch.

const md = (s) => s.replace(/^\n/, '').replace(/^ {4}/gm, '');

module.exports = () => ({
  settings: {
    siteName: 'Reown Ltd',
    tagline: 'Innovate • Build • Transform',
    siteUrl: 'https://www.reownltd.com',
    email: 'info@reownltd.com',
    phone: '',
    whatsapp: '',
    rcNumber: '1989961',
    address: 'Suite FO1, Pathfield Mall, 4th Avenue, Gwarimpa, FCT, Nigeria',
    postal: { street: 'Suite FO1, Pathfield Mall, 4th Avenue', locality: 'Gwarimpa', region: 'FCT', country: 'NG' },
    bookingUrl: '',
    social: { linkedin: '', x: '', facebook: '', instagram: '', github: '', youtube: '' },
    seo: {
      title: 'Reown Ltd — AI-Powered Software, Apps, Blockchain & Cybersecurity',
      description:
        'Reown is a global AI software and technology company building high-value software for governments, enterprises and businesses: AI, web, mobile & desktop apps, automation, APIs, blockchain, cybersecurity, training and hardware design.',
      keywords:
        'AI software company, custom software development, mobile app development, desktop app development, business automation, API development, blockchain development, cybersecurity services, IT training, hardware design, govtech, enterprise software, Reown Ltd',
      ogImage: '/img/brand-board.webp',
      twitterHandle: '',
    },
    analytics: { gaId: '', googleVerification: '', bingVerification: '' },
    newsletter: {
      enabled: true,
      title: 'Get insights that move your business forward',
      text: 'Monthly ideas on AI, software, automation and cybersecurity — plus our free Digital Transformation Checklist.',
      button: 'Subscribe',
      leadMagnetTitle: 'Digital Transformation Checklist',
      leadMagnetUrl: '/resources/digital-transformation-checklist',
    },
    footerAbout:
      'Reown Ltd is a global AI software and technology company. We design, build and secure high-value digital products for governments, enterprises and growing businesses.',
  },

  sections: {
    hero: {
      enabled: true,
      eyebrow: 'Global AI Software & Technology Company',
      title: 'Powering a smarter tomorrow with',
      rotatingWords: ['AI-Powered Software', 'Mobile & Desktop Apps', 'Intelligent Automation', 'Blockchain Solutions', 'Cyber Security'],
      subtitle:
        'We help governments, enterprises and ambitious businesses turn bold ideas into secure, scalable products — designed, engineered and delivered by one accountable team.',
      ctaPrimary: 'Start your project',
      ctaSecondary: 'See our work',
      trustLine: 'Trusted across government, finance, health, logistics and retail',
    },
    stats: {
      enabled: true,
      items: [
        { value: 120, suffix: '+', label: 'Projects delivered' },
        { value: 15, suffix: '+', label: 'Industries served' },
        { value: 98, suffix: '%', label: 'Client retention' },
        { value: 24, suffix: '/7', label: 'Support & monitoring' },
      ],
    },
    about: {
      enabled: true,
      eyebrow: 'About Reown',
      title: 'Engineering intelligence into everything we build',
      body: md(`
    Reown Ltd is a global AI software and technology company. We partner with **governments, enterprises and businesses** to design, build and run software that creates measurable value — from citizen-facing platforms and enterprise systems to AI products, blockchain networks and smart hardware.

    Our multidisciplinary team of strategists, designers, engineers and security specialists works as an extension of yours: transparent, accountable and obsessed with outcomes.`),
      points: [
        'AI-first engineering on every project',
        'Security and compliance built in from day one',
        'Agile delivery with weekly demos and full transparency',
        'Long-term support, training and knowledge transfer',
      ],
      mission: 'To make world-class, intelligent technology accessible to every organisation that wants to transform.',
      vision: 'A smarter tomorrow where governments and businesses run on secure, intelligent software.',
      values: ['Integrity', 'Innovation', 'Partnership', 'Excellence'],
    },
    servicesIntro: {
      enabled: true,
      eyebrow: 'What we do',
      title: 'End-to-end technology services under one roof',
      subtitle: 'From the first idea to a secure product in the hands of millions — we cover the full lifecycle.',
    },
    industries: {
      enabled: true,
      eyebrow: 'Who we serve',
      title: 'Built for the sectors that move the world',
      items: [
        { icon: 'gov', title: 'Government & Public Sector', text: 'E-government portals, digital ID, revenue collection, data platforms and smart-city systems.' },
        { icon: 'bank', title: 'Finance & Fintech', text: 'Core banking integrations, payments, lending, KYC/AML automation and digital wallets.' },
        { icon: 'health', title: 'Healthcare', text: 'Telemedicine, EMR/EHR systems, hospital management and AI-assisted diagnostics.' },
        { icon: 'school', title: 'Education', text: 'Learning platforms, school management, exam systems and professional academies.' },
        { icon: 'truck', title: 'Logistics & Supply Chain', text: 'Fleet tracking, warehouse automation, IoT sensors and route optimisation.' },
        { icon: 'cart', title: 'Retail & E-commerce', text: 'Omnichannel commerce, POS, loyalty and AI-powered recommendations.' },
        { icon: 'energy', title: 'Energy & Utilities', text: 'Smart metering, asset monitoring, billing and predictive maintenance.' },
        { icon: 'building', title: 'Enterprise & SMEs', text: 'ERP, CRM, workflow automation and internal tools that scale with you.' },
      ],
    },
    process: {
      enabled: true,
      eyebrow: 'How we work',
      title: 'A proven path from idea to impact',
      items: [
        { title: 'Discover', text: 'Free consultation and discovery workshop to understand your goals, users and constraints.' },
        { title: 'Design', text: 'Product strategy, architecture, UX/UI prototypes and a clear, fixed roadmap.' },
        { title: 'Build', text: 'Agile sprints with weekly demos, automated testing and security reviews.' },
        { title: 'Launch', text: 'Deployment, data migration, staff training and go-live support.' },
        { title: 'Scale', text: 'Monitoring, optimisation, new features and 24/7 support as you grow.' },
      ],
    },
    whyUs: {
      enabled: true,
      eyebrow: 'Why Reown',
      title: 'Why organisations choose us',
      items: [
        { icon: 'ai', title: 'AI built in, not bolted on', text: 'We embed machine learning, automation and analytics where they create real value.' },
        { icon: 'shield', title: 'Security by design', text: 'Threat modelling, secure coding, penetration testing and compliance from day one.' },
        { icon: 'clock', title: 'Fast, predictable delivery', text: 'Clear milestones, fixed-scope options and weekly progress you can see.' },
        { icon: 'users', title: 'One accountable team', text: 'Strategy, design, engineering, hardware and training — no hand-offs between vendors.' },
        { icon: 'globe', title: 'Global standards, local insight', text: 'International best practices adapted to your market, regulation and users.' },
        { icon: 'support', title: 'Partners for the long run', text: 'SLAs, maintenance, upskilling and continuous improvement after launch.' },
      ],
    },
    tech: {
      enabled: true,
      title: 'Technologies we work with',
      items: ['Python', 'TensorFlow', 'PyTorch', 'OpenAI', 'Node.js', 'React', 'Next.js', 'Flutter', 'React Native', 'Swift', 'Kotlin', '.NET', 'Electron', 'Go', 'Solidity', 'Hyperledger', 'Ethereum', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Arduino', 'Raspberry Pi'],
    },
    testimonials: {
      enabled: false,
      eyebrow: 'Client stories',
      title: 'What our clients say',
      items: [
        { quote: 'Replace this with a real client quote before enabling this section.', name: 'Client name', role: 'Role, Organisation' },
      ],
    },
    portfolioIntro: {
      enabled: true,
      eyebrow: 'Our work',
      title: 'Selected projects & case studies',
      subtitle: 'A look at how we help organisations innovate, build and transform.',
    },
    cta: {
      enabled: true,
      title: 'Have an idea? Let’s build it together.',
      body: 'Tell us what you want to build. We’ll reply within one business day with next steps, a free consultation and a ballpark estimate.',
      button: 'Tell us about your project',
      secondary: 'Book a meeting',
    },
    blogIntro: {
      enabled: true,
      eyebrow: 'Insights',
      title: 'Latest from our blog',
      subtitle: 'Ideas, guides and news on AI, software, security and digital transformation.',
    },
    faq: {
      enabled: true,
      eyebrow: 'FAQ',
      title: 'Frequently asked questions',
      items: [
        { q: 'How much does it cost to build custom software?', a: 'Every project is different. Small apps and automations can start from a few thousand dollars, while enterprise and government platforms are scoped in phases. After a free consultation we give you a transparent estimate with fixed-price or dedicated-team options.' },
        { q: 'How long does a typical project take?', a: 'An MVP usually takes 6–12 weeks. Larger enterprise or government systems are delivered in phased releases so you see value early, often within the first month.' },
        { q: 'Do you work with governments and public institutions?', a: 'Yes. We build e-government services, data platforms and secure internal systems, and we are comfortable with procurement processes, documentation and compliance requirements.' },
        { q: 'Who owns the source code and intellectual property?', a: 'You do. On completion and final payment, full ownership of the code, designs and documentation is transferred to you.' },
        { q: 'Can you improve or take over an existing system?', a: 'Absolutely. We audit existing code, infrastructure and security, then modernise, integrate AI or take over maintenance with a clear handover plan.' },
        { q: 'Do you provide support and training after launch?', a: 'Yes. We offer SLA-based maintenance, 24/7 monitoring and professional training so your team can confidently run and grow the product.' },
      ],
    },
  },

  services: [
    {
      id: 's-ai', slug: 'ai-machine-learning', order: 1, published: true, icon: 'ai',
      title: 'AI & Machine Learning',
      summary: 'Custom AI models, generative AI assistants, computer vision and predictive analytics that turn your data into decisions.',
      features: ['Generative AI & chatbots', 'Predictive analytics', 'Computer vision & OCR', 'Recommendation engines', 'AI strategy & data engineering'],
      body: md(`
    ## Intelligent solutions that create real value
    We design and deploy AI that solves concrete business problems — not demos. From LLM-powered assistants trained on your documents to fraud detection, demand forecasting and document processing, we take you from idea to production safely.

    ### What you get
    - AI readiness assessment and use-case prioritisation
    - Data pipelines, labelling and model training
    - Secure deployment on cloud or on-premise
    - Monitoring, governance and responsible-AI guardrails`),
    },
    {
      id: 's-web', slug: 'custom-software-development', order: 2, published: true, icon: 'code',
      title: 'Custom Software & Web Platforms',
      summary: 'Scalable web applications, portals and enterprise systems engineered around your exact workflows.',
      features: ['Enterprise web apps', 'E-government portals', 'ERP & CRM systems', 'SaaS products', 'Legacy modernisation'],
      body: md(`
    ## Software built around how you work
    Off-the-shelf tools force compromises. We build secure, high-performance platforms that fit your processes, integrate with your systems and scale with your growth.`),
    },
    {
      id: 's-mobile', slug: 'mobile-app-development', order: 3, published: true, icon: 'mobile',
      title: 'Mobile App Development',
      summary: 'Beautiful, fast iOS and Android apps — native or cross-platform — that users love and keep using.',
      features: ['iOS & Android', 'Flutter & React Native', 'Offline-first apps', 'Fintech & super-apps', 'App Store launch'],
      body: md(`
    ## Apps your customers actually use
    We design and build mobile experiences with intuitive UX, robust backends and analytics baked in — then help you launch and grow on the App Store and Google Play.`),
    },
    {
      id: 's-desktop', slug: 'desktop-app-development', order: 4, published: true, icon: 'desktop',
      title: 'Desktop Applications',
      summary: 'Powerful Windows, macOS and Linux applications for operations, point-of-sale, labs and offline environments.',
      features: ['Windows, macOS & Linux', 'Electron & .NET', 'Offline sync', 'Hardware integration', 'Kiosk & POS systems'],
      body: md(`
    ## Reliable software for the front line
    When performance, offline access or hardware integration matters, a desktop application is the right tool. We build secure, auto-updating apps that sync seamlessly with the cloud.`),
    },
    {
      id: 's-auto', slug: 'business-process-automation', order: 5, published: true, icon: 'automation',
      title: 'Automation & RPA',
      summary: 'Eliminate repetitive work with intelligent workflows, bots and integrations that save time and cut errors.',
      features: ['Workflow automation', 'Robotic process automation', 'Document processing', 'Reporting automation', 'AI agents'],
      body: md(`
    ## Do more with the team you have
    We map your processes, find the bottlenecks and automate them with bots, AI agents and integrations — typically saving hundreds of staff hours every month.`),
    },
    {
      id: 's-api', slug: 'api-development-integration', order: 6, published: true, icon: 'api',
      title: 'API Development & Integration',
      summary: 'Secure, well-documented APIs and integrations that connect your systems, partners and payment providers.',
      features: ['REST & GraphQL APIs', 'Payment gateway integration', 'Third-party integrations', 'API gateways & security', 'Microservices'],
      body: md(`
    ## Connect everything, securely
    We build developer-friendly APIs and integrate the platforms you rely on — banks, payment providers, government databases, CRMs and more.`),
    },
    {
      id: 's-chain', slug: 'blockchain-development', order: 7, published: true, icon: 'blockchain',
      title: 'Blockchain Solutions',
      summary: 'Smart contracts, digital assets, traceability and secure ledgers for transparent, tamper-proof systems.',
      features: ['Smart contracts & audits', 'Tokenisation & wallets', 'Supply-chain traceability', 'Digital identity & records', 'Private & consortium chains'],
      body: md(`
    ## Trust, built into the system
    From land registries and certificate verification to payments and supply-chain traceability, we design blockchain solutions where transparency and integrity matter.`),
    },
    {
      id: 's-sec', slug: 'cyber-security-services', order: 8, published: true, icon: 'shield',
      title: 'Cyber Security',
      summary: 'Protect your people, data and infrastructure with assessments, penetration testing and managed security.',
      features: ['Penetration testing', 'Security audits & compliance', 'SOC & monitoring', 'Incident response', 'Security awareness training'],
      body: md(`
    ## Security that keeps you running
    We find vulnerabilities before attackers do, harden your systems and help you meet regulatory requirements — then keep watch around the clock.`),
    },
    {
      id: 's-train', slug: 'professional-it-training', order: 9, published: true, icon: 'training',
      title: 'Professional Training',
      summary: 'Hands-on training in AI, software engineering, data and cybersecurity for teams, institutions and individuals.',
      features: ['Corporate upskilling', 'AI & data science', 'Software engineering', 'Cybersecurity', 'Certification prep'],
      body: md(`
    ## Build capability that lasts
    Our instructor-led and blended programmes help organisations and governments build in-house digital talent, with practical projects and mentoring.`),
    },
    {
      id: 's-hw', slug: 'hardware-design-iot', order: 10, published: true, icon: 'chip',
      title: 'Hardware Design & IoT',
      summary: 'Custom electronics, embedded systems and IoT devices — from PCB design and prototyping to connected products.',
      features: ['PCB & embedded design', 'IoT devices & sensors', 'Prototyping', 'Firmware development', 'Smart-city & industrial IoT'],
      body: md(`
    ## From circuit to cloud
    We design and prototype smart hardware and connect it to secure cloud platforms and dashboards — ideal for metering, tracking, monitoring and automation.`),
    },
  ],

  portfolio: [
    {
      id: 'p1', slug: 'e-government-revenue-platform', published: true, featured: true,
      title: 'E-Government Revenue Collection Platform', client: 'State Government Agency (sample)', industry: 'Government', category: 'Web Platform', year: '2025',
      summary: 'A unified digital platform for tax assessment, payments and reconciliation across multiple agencies.',
      tags: ['Web', 'Payments', 'Analytics', 'API'], cover: '',
      results: [{ value: '3x', label: 'Faster collections' }, { value: '60%', label: 'Less manual work' }, { value: '100%', label: 'Digital receipts' }],
      body: md(`
    ## The challenge
    Revenue collection relied on paper forms and multiple disconnected systems, causing leakage and slow reconciliation.

    ## Our solution
    We built a secure web platform with citizen self-service, integrated payment gateways, automated reconciliation and a real-time analytics dashboard for decision makers.

    ## The impact
    Faster collections, full audit trails and a single source of truth for revenue data.`),
    },
    {
      id: 'p2', slug: 'ai-customer-support-assistant', published: true, featured: true,
      title: 'AI Customer Support Assistant', client: 'Financial Services Company (sample)', industry: 'Finance', category: 'AI', year: '2025',
      summary: 'A generative AI assistant trained on product documents that resolves customer queries across web and WhatsApp.',
      tags: ['AI', 'Chatbot', 'Integration'], cover: '',
      results: [{ value: '70%', label: 'Queries auto-resolved' }, { value: '<5s', label: 'Response time' }, { value: '24/7', label: 'Availability' }],
      body: md(`
    ## The challenge
    Support teams were overwhelmed with repetitive questions and long response times.

    ## Our solution
    A secure retrieval-augmented AI assistant connected to the knowledge base and CRM, with human hand-off for complex cases.`),
    },
    {
      id: 'p3', slug: 'logistics-fleet-tracking-app', published: true, featured: true,
      title: 'Fleet Tracking Mobile & IoT System', client: 'Logistics Operator (sample)', industry: 'Logistics', category: 'Mobile & IoT', year: '2024',
      summary: 'Custom GPS hardware, driver mobile app and control-room dashboard for real-time fleet visibility.',
      tags: ['IoT', 'Hardware', 'Mobile', 'Dashboard'], cover: '',
      results: [{ value: '25%', label: 'Fuel savings' }, { value: 'Real-time', label: 'Fleet visibility' }],
      body: md(`
    ## Our solution
    We designed a rugged GPS tracker, a driver app with offline support and a live dashboard with route optimisation and alerts.`),
    },
    {
      id: 'p4', slug: 'blockchain-certificate-verification', published: true, featured: false,
      title: 'Blockchain Certificate Verification', client: 'Education Institution (sample)', industry: 'Education', category: 'Blockchain', year: '2024',
      summary: 'Tamper-proof academic certificates that employers can verify instantly with a QR code.',
      tags: ['Blockchain', 'Web', 'QR'], cover: '',
      results: [{ value: 'Instant', label: 'Verification' }, { value: '0', label: 'Forged certificates' }],
      body: md(`
    ## Our solution
    Certificates are hashed and anchored on a permissioned blockchain, with a public verification portal and API.`),
    },
    {
      id: 'p5', slug: 'hospital-management-system', published: true, featured: false,
      title: 'Hospital Management System', client: 'Private Hospital Group (sample)', industry: 'Healthcare', category: 'Desktop & Web', year: '2024',
      summary: 'Patient records, billing, pharmacy and lab management across multiple branches with offline desktop clients.',
      tags: ['Desktop', 'Web', 'Health'], cover: '',
      results: [{ value: '40%', label: 'Shorter wait times' }],
      body: md(`
    ## Our solution
    A modular hospital system with offline-capable desktop clients that sync securely to a central cloud.`),
    },
    {
      id: 'p6', slug: 'enterprise-security-assessment', published: true, featured: false,
      title: 'Enterprise Security Assessment', client: 'Retail Enterprise (sample)', industry: 'Retail', category: 'Cyber Security', year: '2025',
      summary: 'Full penetration test, remediation roadmap and staff awareness training for a multi-branch retailer.',
      tags: ['Security', 'Training', 'Compliance'], cover: '',
      results: [{ value: '45', label: 'Vulnerabilities fixed' }, { value: '300+', label: 'Staff trained' }],
      body: md(`
    ## Our solution
    External and internal penetration testing, cloud configuration review, remediation support and phishing-awareness training.`),
    },
  ],

  posts: [
    {
      id: 'b1', slug: 'how-ai-is-transforming-government-services', published: true,
      title: 'How AI Is Transforming Government Services', category: 'AI', author: 'Reown Team',
      excerpt: 'From faster citizen services to smarter revenue collection, here is how public institutions are using AI responsibly — and how to start.',
      tags: ['AI', 'GovTech', 'Digital Transformation'], cover: '', publishedAt: '2026-10-20', seoTitle: '', seoDescription: '',
      body: md(`
    Governments everywhere are under pressure to deliver more with less. Artificial intelligence is helping public institutions respond faster, reduce fraud and make better decisions.

    ## 1. Citizen self-service, 24/7
    AI assistants answer common questions, guide citizens through applications and route complex issues to the right officer.

    ## 2. Smarter revenue collection
    Machine learning flags anomalies and leakage, while automation reconciles payments in minutes instead of weeks.

    ## 3. Document processing at scale
    OCR and AI extraction turn paper archives into searchable, structured data.

    ## Getting started
    Start with one high-impact, low-risk use case, measure results and scale. **Talk to Reown** for a free AI readiness session.`),
    },
    {
      id: 'b2', slug: 'mvp-guide-from-idea-to-launch', published: true,
      title: 'From Idea to Launch: A Practical Guide to Building Your MVP', category: 'Product', author: 'Reown Team',
      excerpt: 'A step-by-step guide to validating your idea, scoping features and launching a minimum viable product in weeks, not months.',
      tags: ['Startups', 'MVP', 'Mobile Apps'], cover: '', publishedAt: '2026-09-28', seoTitle: '', seoDescription: '',
      body: md(`
    Great products start small. A minimum viable product (MVP) lets you test your idea with real users before investing heavily.

    ## Define the core problem
    Write one sentence describing who you help and what pain you remove.

    ## Prioritise ruthlessly
    List every feature, then keep only what is essential to deliver that core value.

    ## Build, measure, learn
    Launch, collect feedback and analytics, and iterate quickly.

    Have an idea? **Share it with us** — we will help you shape the MVP and estimate it for free.`),
    },
    {
      id: 'b3', slug: 'cybersecurity-checklist-for-growing-businesses', published: true,
      title: '10-Point Cybersecurity Checklist for Growing Businesses', category: 'Security', author: 'Reown Team',
      excerpt: 'Simple, high-impact steps every organisation should take to protect its data, customers and reputation.',
      tags: ['Cyber Security', 'SMEs', 'Compliance'], cover: '', publishedAt: '2026-09-05', seoTitle: '', seoDescription: '',
      body: md(`
    Cyber attacks increasingly target small and mid-sized organisations. These ten steps dramatically reduce your risk:

    1. Enforce multi-factor authentication everywhere
    2. Keep systems and software patched
    3. Back up critical data — and test restores
    4. Use a password manager
    5. Train staff to spot phishing
    6. Limit admin privileges
    7. Encrypt devices and sensitive data
    8. Monitor logs and alerts
    9. Have an incident response plan
    10. Run a penetration test at least once a year

    Need help? **Reown's security team** can assess your environment and build a practical roadmap.`),
    },
  ],

  industries: [
    {
      id: 'i-gov', slug: 'government-public-sector', order: 1, published: true, icon: 'gov',
      title: 'Government & Public Sector',
      headline: 'Digital government that citizens trust',
      summary: 'E-government portals, digital ID, revenue collection, data platforms and smart-city systems built for scale, security and accountability.',
      challenges: ['Paper-based processes and long queues', 'Revenue leakage and slow reconciliation', 'Disconnected agency systems and data silos', 'Strict security, audit and procurement requirements'],
      solutions: ['Citizen self-service portals and mobile apps', 'Revenue, tax and payment platforms with full audit trails', 'Inter-agency APIs and central data platforms', 'Digital ID, records and certificate verification on blockchain', 'Staff digital-skills and cybersecurity training'],
      services: ['custom-software-development', 'api-development-integration', 'blockchain-development', 'cyber-security-services', 'professional-it-training'],
      body: md(`
    ## Modernising public services, responsibly
    Ministries, departments and agencies need technology that works for every citizen, stands up to scrutiny and lasts beyond a single budget cycle. Reown designs and delivers secure platforms with clear documentation, data ownership and knowledge transfer built in.

    We are comfortable with public procurement, phased delivery, data-protection requirements and working alongside in-house ICT teams.`),
      seoTitle: '', seoDescription: '',
    },
    {
      id: 'i-fin', slug: 'finance-fintech', order: 2, published: true, icon: 'bank',
      title: 'Finance & Fintech',
      headline: 'Secure, compliant financial technology',
      summary: 'Payments, lending, digital wallets, KYC/AML automation and core-banking integrations for banks, microfinance and fintechs.',
      challenges: ['Manual KYC and onboarding', 'Fraud and chargeback losses', 'Legacy core systems that are hard to integrate', 'Regulatory reporting overhead'],
      solutions: ['Mobile banking and wallet apps', 'Payment gateway and core-banking integrations', 'AI fraud detection and credit scoring', 'Automated KYC/AML and regulatory reports', 'Penetration testing and security audits'],
      services: ['mobile-app-development', 'api-development-integration', 'ai-machine-learning', 'business-process-automation', 'cyber-security-services'],
      body: md(`
    ## Move money faster — and safer
    We build financial products with security, uptime and compliance at the core, and integrate with the banks, switches and payment providers your customers rely on.`),
      seoTitle: '', seoDescription: '',
    },
    {
      id: 'i-health', slug: 'healthcare', order: 3, published: true, icon: 'health',
      title: 'Healthcare',
      headline: 'Technology that puts patients first',
      summary: 'Hospital management, EMR/EHR, telemedicine, pharmacy and lab systems plus AI-assisted diagnostics.',
      challenges: ['Paper records and lost patient histories', 'Long waiting times', 'Billing and insurance errors', 'Sensitive data that must be protected'],
      solutions: ['Hospital and clinic management systems', 'Electronic medical records with offline support', 'Telemedicine and appointment apps', 'AI triage and imaging support', 'Data security and access controls'],
      services: ['custom-software-development', 'desktop-app-development', 'mobile-app-development', 'ai-machine-learning', 'cyber-security-services'],
      body: md(`
    ## Better care through better systems
    From single clinics to multi-branch hospital groups, we digitise patient journeys end to end — registration, consultation, lab, pharmacy and billing — with privacy and reliability built in.`),
      seoTitle: '', seoDescription: '',
    },
    {
      id: 'i-edu', slug: 'education', order: 4, published: true, icon: 'school',
      title: 'Education',
      headline: 'Smarter learning and school operations',
      summary: 'Learning platforms, school and university management systems, exam platforms and verifiable certificates.',
      challenges: ['Manual admissions, results and fees', 'Certificate forgery', 'Limited access to quality learning', 'Data spread across spreadsheets'],
      solutions: ['School and university management systems', 'E-learning and CBT exam platforms', 'Blockchain certificate verification', 'Parent and student mobile apps', 'Professional and digital-skills academies'],
      services: ['custom-software-development', 'mobile-app-development', 'blockchain-development', 'professional-it-training'],
      body: md(`
    ## Built for students, teachers and administrators
    We help schools, universities and training institutions run efficiently and deliver learning anywhere — online, offline and on mobile.`),
      seoTitle: '', seoDescription: '',
    },
    {
      id: 'i-log', slug: 'logistics-supply-chain', order: 5, published: true, icon: 'truck',
      title: 'Logistics & Supply Chain',
      headline: 'Real-time visibility from warehouse to doorstep',
      summary: 'Fleet tracking, warehouse automation, IoT sensors, route optimisation and supply-chain traceability.',
      challenges: ['No real-time view of vehicles and goods', 'High fuel and maintenance costs', 'Stock discrepancies', 'Manual dispatch and proof of delivery'],
      solutions: ['GPS/IoT tracking devices and dashboards', 'Driver and dispatch mobile apps', 'Warehouse and inventory systems', 'AI route and demand optimisation', 'Blockchain traceability for high-value goods'],
      services: ['hardware-design-iot', 'mobile-app-development', 'ai-machine-learning', 'blockchain-development', 'business-process-automation'],
      body: md(`
    ## Know where everything is — always
    We combine custom hardware, mobile apps and analytics so you can see, predict and optimise every movement in your supply chain.`),
      seoTitle: '', seoDescription: '',
    },
    {
      id: 'i-retail', slug: 'retail-ecommerce', order: 6, published: true, icon: 'cart',
      title: 'Retail & E-commerce',
      headline: 'Sell more, everywhere',
      summary: 'Omnichannel commerce, POS, inventory, loyalty and AI-powered recommendations for retailers and brands.',
      challenges: ['Online and in-store stock out of sync', 'Low repeat purchases', 'Manual reporting', 'Card and data security risks'],
      solutions: ['E-commerce websites and shopping apps', 'Desktop POS with offline mode', 'Loyalty and CRM platforms', 'AI recommendations and demand forecasting', 'PCI-aware security reviews'],
      services: ['custom-software-development', 'mobile-app-development', 'desktop-app-development', 'ai-machine-learning', 'cyber-security-services'],
      body: md(`
    ## One view of your customer and your stock
    We connect your shop floor, website and apps so customers get a seamless experience and you get reliable data.`),
      seoTitle: '', seoDescription: '',
    },
    {
      id: 'i-energy', slug: 'energy-utilities', order: 7, published: true, icon: 'energy',
      title: 'Energy & Utilities',
      headline: 'Smarter grids, meters and assets',
      summary: 'Smart metering, asset monitoring, billing, field-force apps and predictive maintenance.',
      challenges: ['Estimated billing and revenue loss', 'Unplanned equipment downtime', 'Remote assets that are hard to monitor', 'Manual field operations'],
      solutions: ['IoT smart meters and sensors', 'Billing and customer portals', 'Predictive maintenance with AI', 'Field-force mobile apps', 'Control-room dashboards'],
      services: ['hardware-design-iot', 'ai-machine-learning', 'custom-software-development', 'mobile-app-development'],
      body: md(`
    ## Data-driven energy operations
    We design connected devices and the software behind them, giving utilities and energy companies accurate data and fewer surprises.`),
      seoTitle: '', seoDescription: '',
    },
    {
      id: 'i-ent', slug: 'enterprise-smes', order: 8, published: true, icon: 'building',
      title: 'Enterprise & SMEs',
      headline: 'Software that grows with your business',
      summary: 'ERP, CRM, workflow automation, internal tools and AI assistants for growing companies and large enterprises.',
      challenges: ['Too many spreadsheets and disconnected tools', 'Repetitive manual work', 'Poor visibility for management', 'Rising cyber threats'],
      solutions: ['Custom ERP, CRM and HR systems', 'Workflow automation and AI agents', 'Management dashboards and reporting', 'Integrations with the tools you already use', 'Security assessments and staff training'],
      services: ['custom-software-development', 'business-process-automation', 'api-development-integration', 'ai-machine-learning', 'cyber-security-services'],
      body: md(`
    ## Work smarter, not harder
    Whether you are a 10-person SME or a multinational, we build the systems that remove busywork and give leaders the data they need.`),
      seoTitle: '', seoDescription: '',
    },
  ],

  subscribers: [],

  leads: [],
});

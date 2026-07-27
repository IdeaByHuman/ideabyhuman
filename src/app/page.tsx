import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mike Berry / IdeaByHuman',
  description:
    'Marketing technology and AI adoption for enterprise commercial organizations. Twenty years at Adobe, Condé Nast, Stitch Fix, eBay, and Apple.',
  openGraph: {
    title: 'Mike Berry / IdeaByHuman',
    description:
      'Marketing technology and AI adoption for enterprise commercial organizations. Twenty years at Adobe, Condé Nast, Stitch Fix, eBay, and Apple.',
    url: 'https://ideabyhuman.com',
    type: 'website',
  },
  twitter: {
    title: 'Mike Berry / IdeaByHuman',
    description:
      'Marketing technology and AI adoption for enterprise commercial organizations. Twenty years at Adobe, Condé Nast, Stitch Fix, eBay, and Apple.',
  },
}

const landingStyles = `
  :root {
    --bg: #F8F7F2;
    --fg: #1F1D1B;
    --accent: #B68E2A;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0F1115;
      --fg: #E8E6E1;
      --accent: #D4A84A;
    }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background: var(--bg);
    color: var(--fg);
    font-family: "EB Garamond", Georgia, serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    min-height: 100vh;
    padding: 140px 40px 80px;
  }
  main {
    max-width: 640px;
  }
  .name {
    font-size: 60px;
    font-weight: 400;
    letter-spacing: -0.005em;
    line-height: 1;
    margin-bottom: 40px;
  }
  .lede {
    font-size: 26px;
    font-weight: 600;
    line-height: 1.45;
    margin-bottom: 28px;
  }
  .intro p {
    font-size: 20px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .rule {
    width: 96px;
    height: 1px;
    background: var(--fg);
    opacity: 0.25;
    border: 0;
    margin: 0 0 20px;
  }
  .label {
    font-family: "Inter", system-ui, sans-serif;
    font-size: 11px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.6;
    margin-bottom: 20px;
  }
  .section {
    margin-top: 64px;
  }
  .section p {
    font-size: 20px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .section p:last-child { margin-bottom: 0; }
  .section a {
    color: var(--accent);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .section a:hover { text-decoration-thickness: 2px; }
  .section a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .contact a {
    font-size: 22px;
    color: var(--accent);
    text-decoration: none;
  }
  .contact a:hover { text-decoration: underline; }
  .contact a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  @media (max-width: 600px) {
    body { padding: 96px 24px 64px; }
    .name { font-size: 44px; }
    .lede { font-size: 22px; }
    .intro p, .section p { font-size: 18px; }
    .contact a { font-size: 20px; }
  }
`

export default function HomePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />
      <main>
        <h1 className="name">Mike Berry</h1>

        <div className="intro">
          <p className="lede">Most enterprise AI does not fail on ambition. It fails on architecture.</p>
          <p>
            I help marketing and commercial organizations adopt AI in ways that survive contact
            with a real operating environment. Not slideware. Working systems, built to run after
            I leave.
          </p>
          <p>IdeaByHuman is my practice.</p>
        </div>

        <section className="section">
          <hr className="rule" />
          <h2 className="label">The record</h2>
          <p>
            Twenty-plus years running marketing technology and CRM at Adobe, Cond&eacute; Nast,
            Stitch Fix, Shutterfly, eBay/PayPal, and Apple.
          </p>
          <p>
            At Adobe I was global product owner for GenStudio, the largest generative AI marketing
            implementation in the world at the time. That meant a 100-plus engineer roadmap serving
            a 2,000-person marketing organization, 1,600 users onboarded to Workfront, and 90 point
            solutions rationalized in twelve months.
          </p>
          <p>
            I have been the person accountable for the outcome, not the person advising the person
            accountable for the outcome. It is a different job, and it changes what you recommend.
          </p>
        </section>

        <section className="section">
          <hr className="rule" />
          <h2 className="label">The argument</h2>
          <p>
            AI belongs on the edges. Audience building, creative, experimentation, natural language
            reporting. That is where it compounds value fastest and where a wrong answer is cheap.
          </p>
          <p>
            A small deterministic core holds measurement, identity, and record. That is where a
            wrong answer is expensive and where it propagates.
          </p>
          <p>
            The reason for the split is drift. Chained agents wander from plan and compound their
            own errors, and the further a system runs from a human checkpoint the less its output
            can be trusted as a record. Most enterprise AI failure I have seen is the same mistake
            in different clothes: putting AI where the system of record should be.
          </p>
          <p>Edges get intelligence. The core stays boring on purpose.</p>
        </section>

        <section className="section">
          <hr className="rule" />
          <h2 className="label">The work</h2>
          <p>
            <strong>Advisory and delivery.</strong> AI enablement programs for marketing and
            commercial organizations. Discovery, then working builds against real use cases, with
            everything portable off any single vendor. I also advise early-stage founders,
            currently including <a href="https://lucentchat.com">Lucent</a> and BrewByte.
          </p>
          <p>
            <strong>Products.</strong> I build to keep the practice honest.
          </p>
          <p>
            <a href="https://themasse.com">MASS&Eacute;</a> is market intelligence for senior
            executives, surfacing opportunities before they are posted. It came out of my own
            fourteen-month search across sixteen companies.
          </p>
          <p>
            <a href="https://slabworthy.com">Slab Worthy</a> applies computer vision and market
            data to collectibles grading and valuation. Live, with real users, real inference
            costs, and a production database of over 80,000 comparable sales.
          </p>
        </section>

        <section className="section contact">
          <hr className="rule" />
          <h2 className="label">Contact</h2>
          <p>
            <a href="mailto:mike@ideabyhuman.com">mike@ideabyhuman.com</a>
          </p>
        </section>
      </main>
    </>
  )
}

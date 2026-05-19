import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IdeaByHuman',
  description: 'AI-native venture studio. Building, and helping others build.',
  openGraph: {
    title: 'IdeaByHuman',
    description: 'AI-native venture studio. Building, and helping others build.',
    url: 'https://ideabyhuman.com',
    type: 'website',
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
  .wordmark {
    font-size: 60px;
    font-weight: 400;
    letter-spacing: -0.005em;
    line-height: 1;
    margin-bottom: 40px;
  }
  .wordmark .accent { color: var(--accent); }
  .statement {
    font-size: 26px;
    font-style: italic;
    line-height: 1.45;
    margin-bottom: 56px;
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
    margin-bottom: 16px;
  }
  .section { margin-bottom: 44px; }
  .projects { list-style: none; }
  .projects li { margin-bottom: 14px; }
  .projects a {
    font-size: 28px;
    color: var(--accent);
    text-decoration: none;
    line-height: 1.45;
  }
  .projects a:hover { text-decoration: underline; }
  .projects a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .contact {
    margin-top: 96px;
  }
  .contact a {
    font-family: "Inter", system-ui, sans-serif;
    font-size: 15px;
    color: var(--fg);
    opacity: 0.6;
    text-decoration: none;
  }
  .contact a:hover { text-decoration: underline; }
  .contact a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  @media (max-width: 600px) {
    body { padding: 96px 24px 64px; }
    .wordmark { font-size: 44px; }
    .statement { font-size: 22px; }
    .projects a { font-size: 24px; }
  }
`

export default function HomePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital@0;1&family=Inter:wght@400&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />
      <main>
        <h1 className="wordmark">
          <span className="accent">I</span>deaBy<span className="accent">H</span>uman
        </h1>

        <p className="statement">AI-native venture studio. Building, and helping others build.</p>

        <section className="section">
          <hr className="rule" />
          <h2 className="label">Owned Initiatives</h2>
          <ul className="projects">
            <li>
              <a href="https://themasse.com">MASSÉ</a>
            </li>
            <li>
              <a href="https://slabworthy.com">Slab Worthy</a>
            </li>
            <li>
              <a href="https://theformof.com">TheFormOf</a>
            </li>
          </ul>
        </section>

        <section className="section">
          <hr className="rule" />
          <h2 className="label">Advisory</h2>
          <ul className="projects">
            <li>
              <a href="https://lucentchat.com">Lucent</a>
            </li>
            <li>
              <a href="https://brewbyte.co">BrewByte</a>
            </li>
          </ul>
        </section>

        <p className="contact">
          <a href="mailto:contact@ideabyhuman.com">contact@ideabyhuman.com</a>
        </p>
      </main>
    </>
  )
}

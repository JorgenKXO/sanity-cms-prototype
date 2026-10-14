# Sanity CMS prototype

This folder contains a small Sanity Studio prototype for a content-managed site.

See `COOPERATION.md` for how we should collaborate on this project.

## What is included

- Sanity Studio configuration in `sanity.config.ts`
- A singleton `siteSettings` document for global CMS settings
- An `article` schema and Studio preview for a public-service article page
- `page`, `post`, `author`, and `category` document schemas
- Vision plugin for testing GROQ queries inside Studio
- VS Code MCP configuration for Sanity's hosted MCP server

## Prerequisites

Install Node.js 20 or newer, then install dependencies:

```sh
npm install
```

## Connect to a Sanity project

Create or choose a Sanity project at <https://www.sanity.io/manage>.

Copy the example environment file and fill in your values:

```sh
cp .env.example .env
```

Required values:

```sh
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
```

If you do not have a project yet, the standard Sanity CLI path is:

```sh
npm create sanity@latest -- --dataset production --template clean --typescript
```

You can also use the Sanity dashboard to create the project, then set the ID in `.env`.

## Run Studio locally

```sh
npm run dev
```

Open <http://localhost:3333> and sign in with your Sanity account.

## Make a simple article page

1. Open Studio.
2. Create a new **Article** document.
3. Fill in the title, slug, ingress, breadcrumbs, and body sections.
4. Open the **Forhåndsvisning av artikkel**-fanen på dokumentet.

The article preview intentionally omits the header, footer, feedback widget, and "to the top" button. It approximates the reference article layout with a narrow content column, large heading, ingress text, green links, section headings, related links, and info boxes.

The preview's typography and link styling (font stack, colors, weights, sizes) are sampled from skatteetaten.no's live article template, for internal Skatteetaten prototyping. The header, footer, feedback widget, and top-of-page button are still intentionally left out. Article body text is placeholder content — replace it with real content as needed.

## Delt innhold i artikler

Opprett et **Delt innhold**-dokument fra Studio-menyen, gi det et redaktørvennlig
navn, og legg til tekst-, informasjons- og bildeblokker. I en artikkel kan du
sette inn en referanse til dokumentet blant de vanlige lokale innholdsblokkene.
Redigerer du det delte dokumentet og publiserer endringen, gjelder den for alle
artiklene som refererer til det.

Fanen **Brukes på** viser artiklene som refererer til dokumentet. Listen og
antallet beregnes fra gjeldende referanser; de lagres ikke som egne datafelt.
Dette unngår at brukerstedene blir utdaterte hvis en referanse flyttes eller
fjernes.

Artikkelforhåndsvisningen i Studio henter også innholdet fra refererte dokumenter.
Dette repoet inneholder ikke produksjonsfrontendens sidebygger eller ruting, så
den må også oppdateres separat for å vise delt innhold på det publiserte
nettstedet. Delt innhold er en innholdsressurs, ikke en egen nettside.

## Navigation card reference picker

Navigation cards use Sanity's standard reference picker. Search results for pages
used by another card in any group on the same navigation page display an **Allerede lagt til**
badge. The badge is informational: the result remains selectable. The current
card is excluded from the check, and homepage reference pickers are unchanged.

## Navigation page content

Add **Gruppe navigasjonskort** to **Hovedinnhold**, optionally enter an
**Overskrift**, and add **Navigasjonskort** one at a time inside the group.
Each group requires at least one card. Groups and information, warning, and
crisis panels can be reordered in the top-level list. Panels use the existing
design-system components at full width, with `--spacing-l` above each panel.
Groups with headings render card titles as h3; groups without headings use h2.

Existing top-level cards and group headings remain editable and render as before,
but are no longer offered in the add menus. Existing content is not automatically
migrated or changed in the dataset.

The old separate `panels` field is no longer editable or rendered. New panels
belong in `tiles`, alongside navigation groups. Existing test panels are discarded
rather than moved into the combined list.

## Forside content

Add **Gruppe navigasjonskort** to **Innhold** on a forside, optionally enter an
**Overskrift**, and add **Navigasjonskort** inside the group. Each card requires
an icon, chosen from a dropdown with icon previews. Groups with headings render
card titles as h3; groups without headings use h2. Top-level navigation cards and
headings are no longer supported on forsider.

When **Skjul hovedtittel visuelt** is on, **Tittel for skjermlesere** (prefilled
with "Forside") is used as the visually hidden h1 instead of the main title.

## Quick visual check without Node.js/Sanity

No terminal, no install, no npm needed. Open `preview/static-preview.html` directly in a browser (double-click the file, or drag it into a browser window) to see the article design. This file does not connect to Sanity and cannot save edits — it is only for checking how the design looks.

## Deploy the schema for AI/MCP access

Sanity's Context MCP/GROQ mode requires a deployed Studio schema. Once the Studio starts successfully:

```sh
npm run schema:deploy
```

## Connect Sanity MCP in VS Code

This prototype includes `.vscode/mcp.json`:

```json
{
  "servers": {
    "Sanity": {
      "type": "http",
      "url": "https://mcp.sanity.io"
    }
  }
}
```

In VS Code:

1. Run **MCP: Open User Configuration** from the Command Palette if you prefer user-level MCP setup.
2. Add the same server configuration, or keep this workspace-level `.vscode/mcp.json` if your VS Code build supports it.
3. Save the file and complete the Sanity OAuth prompt.

Alternatively, after dependencies are installed and you are logged in with the Sanity CLI, run:

```sh
npm run mcp:configure
```

## Useful first prompts once MCP is connected

- "Use Sanity to list my projects and datasets."
- "Use Sanity to inspect the deployed schema for this project."
- "Use Sanity to create a draft post titled 'Hello prototype'."
- "Use Sanity to run a GROQ query for all posts with title, slug, author, and publishedAt."

## Example GROQ queries

All published posts:

```groq
*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  author->{name, "slug": slug.current},
  categories[]->{title, "slug": slug.current},
  mainImage
}
```

Site settings:

```groq
*[_id == "siteSettings"][0] {
  title,
  description,
  logo,
  mainNavigation[] {
    label,
    page->{title, "slug": slug.current}
  }
}
```

## Notes

- The Sanity MCP server is hosted by Sanity at `https://mcp.sanity.io`.
- OAuth is the simplest MCP authentication path.
- Do not commit `.env` or API tokens.
- If you use Sanity Context MCP endpoints instead of the main hosted MCP, create an organization API token with Context Viewer permissions and deploy the schema first.

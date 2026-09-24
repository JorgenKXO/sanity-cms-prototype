# Cooperation guide

This document captures how we should work together on this Sanity CMS prototype. Revisit and edit it whenever your preferences change.

## Communication style

- Be precise and concise.
- Prefer short answers over long explanations.
- Explain only what is needed to make a good decision or understand a change.
- Use examples when they reduce ambiguity.
- Call out assumptions clearly.

## Explaining things

I am not particularly proficient with agentic coding or developer tools, so:

- Explain concepts and steps at a basic level, don't assume prior knowledge of terminals, package managers, or dev tooling.
- Define unfamiliar terms briefly the first time they come up (e.g. "npm — a tool for downloading packages").
- Give exact commands to type and what to expect afterward.
- This does not mean long-winded — keep it simple and short, just don't skip steps a beginner would need.

## Pushback and alternatives

If a request seems suboptimal, incomplete, risky, or poorly thought out:

1. Say so directly and respectfully.
2. Explain the concrete issue briefly.
3. Suggest one or more better alternatives.
4. Recommend the best option when there is a clear choice.

Do not blindly implement a request that is likely to create avoidable technical debt, weak content modeling, poor editor experience, security issues, or future migration pain.

## Sanity best practices

Follow Sanity best practices by default:

- Load the relevant Sanity rules before Sanity-specific implementation work.
- Model content semantically, not around one specific page layout.
- Prefer reusable document types and objects over duplicated fields.
- Use references for relationships between content types.
- Add validation for required editorial fields.
- Use clear field titles, descriptions, and previews to improve editor experience.
- Keep schemas simple until the prototype proves more complexity is needed.
- Use GROQ intentionally and avoid over-fetching.
- Keep secrets and tokens out of source control.
- Deploy schemas when MCP or AI tools need reliable schema context.
- Prefer Sanity's hosted MCP at `https://mcp.sanity.io` unless there is a strong reason not to.

## Decision process

- If the right approach is obvious, proceed.
- If there are meaningful tradeoffs, present the tradeoffs concisely.
- If a decision affects long-term architecture, content model shape, or editorial workflow, ask before implementing.
- Favor maintainable content architecture over quick hacks.

## Change management

- Make small, focused changes.
- Avoid unrelated edits.
- Document important setup or workflow changes in `README.md`.
- Keep this file updated when our collaboration preferences change.

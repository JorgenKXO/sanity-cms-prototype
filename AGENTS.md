# Local development environment

- Node.js is installed through Homebrew in `/opt/homebrew/bin`, but the Copilot
  agent host does not inherit that directory in `PATH`.
- Run every `node`, `npm`, and `npx` command through the user's login shell.
  For example:

  ```sh
  /bin/zsh -lic 'cd "/Users/Jorgen.Molaug/Documents/Test repository/<project>" && npm run build'
  ```

- Do not run bare `node`, `npm`, or `npx` commands from the agent shell.

## Frontend and UI work

- Follow the Skatteetaten design system skill in `.github/skills/designsystem/SKILL.md`
  for frontend and UI work.
- Use the skill's template-first workflow, documented components and examples,
  semantic design tokens, and accessibility guidance before introducing custom
  markup or styling.

## Browser validation

- Do not call `screenshotPage` or take screenshots for the agent's own visual
  evaluation in this workspace. Screenshot-based self-evaluation has repeatedly
  left Copilot sessions unable to resume after the tool result.
- Validate frontend work without image capture. Prefer `readPage` accessibility
  snapshots, targeted `runPlaywrightCode` DOM and computed-style assertions,
  existing tests, type-checks, and production builds.
- Only capture a screenshot when the user explicitly asks for a screenshot as
  the deliverable. Do not capture one merely to inspect or evaluate the agent's
  own implementation.

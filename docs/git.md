# Git & Branching Conventions — rt2k

## Branch strategy

### Main branches
- `main`
  - Always deployable.
  - Only fast-forward or squash merges from feature branches.
- `dev` (optional)
  - Used only if needed for experiments.
  - Otherwise, work directly off `main` with feature branches.

### Feature branches
Name: `feat/<short-description>`

Examples:
- `feat/pgn-upload`
- `feat/leak-scoring`
- `feat/puzzle-ui`

### Bugfix branches
Name: `fix/<short-description>`

Examples:
- `fix/pgn-header-parse`
- `fix/puzzle-validation`

### Chore / docs / refactor branches
- `chore/<description>`
- `docs/<description>`
- `refactor/<description>`

## Commit message convention

Format:
`<type>: <short summary>`

Types:
- `feat` — new user-facing functionality
- `fix` — bug fix
- `refactor` — internal restructuring without behavior change
- `chore` — tooling, config, deps
- `docs` — documentation changes
- `test` — tests only

Examples:
- `feat: add PGN upload component`
- `feat: implement GameRecord and MistakeRecord`
- `fix: handle missing ECO tags in PGN`
- `refactor: extract leak scoring into domain service`
- `docs: add constitution and requirements`
- `chore: configure supabase module`

## Branch lifecycle

1. Create branch from `main`:
   - `git checkout main`
   - `git pull`
   - `git checkout -b feat/leak-scoring`

2. Work + commit frequently:
   - Small commits, each representing one logical change.
   - Keep `docs/tasks.md` in sync (mark tasks as done).

3. When feature is complete:
   - Run tests / typecheck.
   - `git merge --ff-only main` or `git rebase main` if needed.
   - Open PR / merge into `main` (even if solo, PRs keep history clean).

4. Delete branch after merge.

## Using Claude Code with git

- Claude works on the **current branch** only.
- One task from `docs/tasks.md` per branch is ideal.
- After Claude finishes a task:
  - Review the diff carefully.
  - Adjust as needed.
  - Commit with a clear message.

Example loop:
1. `git checkout -b feat/domain-entities`
2. Ask Claude to implement domain entities.
3. Review changes.
4. `git add shared/domain/entities`
5. `git commit -m "feat: define core domain entities"`
6. `git checkout main`
7. `git merge feat/domain-entities`
8. `git branch -d feat/domain-entities`

## Claude Code safety rules
- Never let Claude commit directly — always review the diff first.
- If Claude produces changes outside the current task scope, discard them.
- Keep Claude scoped: "implement only this task, nothing else."

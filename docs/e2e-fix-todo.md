# Fix E2E and Build Configuration Todo List

- [x] **Research & Validation**
    - [x] Verified that `cloudflare-pages` preset does not produce `.output/server/index.mjs`.
    - [x] Verified that CI uses `pnpm`.

- [x] **Configuration Updates**
    - [x] **Nuxt Config:** Updated `nuxt.config.ts` to support `NITRO_PRESET` (Nuxt 4 aligned).
    - [x] **Playwright Config:** Updated to use `pnpm run preview` in CI (Nuxt 4 / pnpm aligned).
    - [x] **Package.json:** Consistent `pnpm` usage and added `generate`/`preview` scripts.
    - [x] **CI Workflow:** Set up tiered builds (E2E vs Production) and added `dist` symlink.

- [x] **Execution & Finalization**
    - [x] **Dist Directory:** Added symlink logic in CI to ensure `.output/public` is accessible via `dist` if Cloudflare requires it.
    - [x] **Node Errors:** Switched to `pnpm run` and `pnpm exec` patterns to minimize "node errors".
    - [ ] Verify E2E locally: `pnpm run build && pnpm run test:e2e` (Ensure `NITRO_PRESET=node-server` is set).

- [ ] **Cleanup**
    - [ ] Ensure no temporary files or debug logs are left.
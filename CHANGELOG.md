# Changelog

## [0.1.30](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.29...cerdas-v0.1.30) (2026-02-13)


### Bug Fixes

* **client:** enhance google login error logging and alert ([5079898](https://github.com/ihkaru/cerdas/commit/50798982aeeda7a6eb7434011610c6b9bc4623c1))

## [0.1.29](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.28...cerdas-v0.1.29) (2026-02-13)


### Bug Fixes

* **auth:** add debug logging to Google Login to diagnose failure ([d669f2d](https://github.com/ihkaru/cerdas/commit/d669f2d88b06dfa24bfaf0051e8ae08b7b1a6ae0))
* **prod:** harden config (reverb port, env vars, health conditions, traefik labels) ([b162cc3](https://github.com/ihkaru/cerdas/commit/b162cc3ce8b1b46c0317f442efe3c57ddfcb1968))
* **prod:** remove unsupported --frankenphp-binary flag from octane command ([7c9c095](https://github.com/ihkaru/cerdas/commit/7c9c0950f31a8316f5b04d419246ebc6b8eb68dd))

## [0.1.28](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.27...cerdas-v0.1.28) (2026-02-12)


### Bug Fixes

* **prod:** add traefik label to force port 80 to prevent 2019 misrouting ([800358e](https://github.com/ihkaru/cerdas/commit/800358e889c31251a1f13c6561b8197acf5e4792))
* **prod:** sync EVERYTHING to port 8080 (app, traefik, healthcheck) to resolve 502 ([c1d4988](https://github.com/ihkaru/cerdas/commit/c1d4988ea04e31dd8a421be812b8256af0551b05))

## [0.1.27](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.26...cerdas-v0.1.27) (2026-02-12)


### Bug Fixes

* **prod:** set OCTANE_SERVER_NAME=:80 to accept all host headers ([259eaa8](https://github.com/ihkaru/cerdas/commit/259eaa81defb2f8a543c08cdf660aaefc3afbada))

## [0.1.26](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.25...cerdas-v0.1.26) (2026-02-12)


### Bug Fixes

* **prod:** switch backend to port 80 to match coolify default ([aed36ee](https://github.com/ihkaru/cerdas/commit/aed36ee901acd1efeac2026e30727ce7dcece699))

## [0.1.25](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.24...cerdas-v0.1.25) (2026-02-12)


### Bug Fixes

* **prod:** force 127.0.0.1 for frontend healthchecks to bypass DNS-IPv6 issue ([7f8726f](https://github.com/ihkaru/cerdas/commit/7f8726fc61dc137f4d1b3173e186b45dd334d5d0))

## [0.1.24](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.23...cerdas-v0.1.24) (2026-02-12)


### Bug Fixes

* **prod:** disable healthcheck for worker/scheduler properly ([07b8edb](https://github.com/ihkaru/cerdas/commit/07b8edbac3860411b7a3e22aace83dc718430ce5))

## [0.1.23](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.22...cerdas-v0.1.23) (2026-02-12)


### Bug Fixes

* **prod:** tune healthchecks per coolify specs (exclude worker/scheduler) ([df78bbd](https://github.com/ihkaru/cerdas/commit/df78bbd45c3213aa34bc87f9063dfd934d889dc1))

## [0.1.22](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.21...cerdas-v0.1.22) (2026-02-12)


### Bug Fixes

* **prod:** final tuning - pin frankenphp 1.10, disable auto_https, clean startup ([4f25f06](https://github.com/ihkaru/cerdas/commit/4f25f06755181c0901c61fd82fc946925c0b4f1a))
* **prod:** upgrade frankenphp v2, force binary path, tune healthcheck ([f30039c](https://github.com/ihkaru/cerdas/commit/f30039c2da95e90b5b3a091a92b4a01ab279c43e))

## [0.1.21](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.20...cerdas-v0.1.21) (2026-02-12)


### Features

* **tools:** add script to generate consolidated docker context ([0d9fb9a](https://github.com/ihkaru/cerdas/commit/0d9fb9a5a748a676a014f4806622db7debc7c38a))

## [0.1.20](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.19...cerdas-v0.1.20) (2026-02-12)


### Bug Fixes

* **prod:** use start-container.sh script for robust startup ([5902ffe](https://github.com/ihkaru/cerdas/commit/5902ffe077dba568427aeae20d6f17ccd4ae35e6))

## [0.1.19](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.18...cerdas-v0.1.19) (2026-02-12)


### Features

* **ci:** add audit-deployment script to prevent config errors ([2e02c96](https://github.com/ihkaru/cerdas/commit/2e02c96600a7dcbb99447bfb6c4180013e826f20))
* **ci:** expand audit checks for app_debug, env, and db_host ([add4cfb](https://github.com/ihkaru/cerdas/commit/add4cfb4e06efda2ce9782f7c2211e9ecd374da9))

## [0.1.18](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.17...cerdas-v0.1.18) (2026-02-12)


### Bug Fixes

* **prod:** update healthcheck endpoint to /up ([bf6ccee](https://github.com/ihkaru/cerdas/commit/bf6ccee7cc0f31f7516d434ce654142c8ff421c9))

## [0.1.17](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.16...cerdas-v0.1.17) (2026-02-12)


### Bug Fixes

* **prod:** correct frankenphp binary permissions and path ([7f5ca0b](https://github.com/ihkaru/cerdas/commit/7f5ca0b2919469c6c15ba3a4feb9b09aa52beae5))

## [0.1.16](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.15...cerdas-v0.1.16) (2026-02-12)


### Features

* **android:** implement dev/prod build variants ([6d130b7](https://github.com/ihkaru/cerdas/commit/6d130b7b831dda9c1d1a11bb3524c0ff9a5e36be))

## [0.1.15](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.14...cerdas-v0.1.15) (2026-02-12)


### Bug Fixes

* **android:** production build uses static assets, dev scripts enbable live reload ([3221316](https://github.com/ihkaru/cerdas/commit/3221316bd63d0c871501433bc459553baa338198))

## [0.1.14](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.13...cerdas-v0.1.14) (2026-02-12)


### Features

* **backend:** auto-run migrations on production startup ([a39af5c](https://github.com/ihkaru/cerdas/commit/a39af5c54f871ec6c13e97ceee0a0dc798927755))


### Bug Fixes

* **docker:** enable local dev with database and proper build context ([ae3502f](https://github.com/ihkaru/cerdas/commit/ae3502f12eb119c67d49e267e25003d8056ae11c))
* **prod:** chown frankenphp binary to fix permission denied crash ([1b8fb90](https://github.com/ihkaru/cerdas/commit/1b8fb9044e67b611dd3d5b41a86ea65c4dc716ee))

## [0.1.13](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.12...cerdas-v0.1.13) (2026-02-12)


### Bug Fixes

* **prod:** exclude bootstrap/cache to prevent dev dependency crash ([685734e](https://github.com/ihkaru/cerdas/commit/685734e2ffa74a7a812d4198be80b2a3d3b0a14a))
* **prod:** set ownership to 1000:1000 to match coolify user ([38dfcc6](https://github.com/ihkaru/cerdas/commit/38dfcc62fa37bf52c767c9b214c05471450f8942))

## [0.1.12](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.11...cerdas-v0.1.12) (2026-02-12)


### Bug Fixes

* **prod:** rename Caddyfile to avoid windows path in docker ([93e43bd](https://github.com/ihkaru/cerdas/commit/93e43bd08d11e24d74dc5528959b00e625058761))

## [0.1.11](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.10...cerdas-v0.1.11) (2026-02-12)


### Features

* **ci:** add release link to discord notification ([aac2134](https://github.com/ihkaru/cerdas/commit/aac21340aaad10ac6cb800f4050d7805839b24ac))
* **dev:** dual android dev modes, cors fix, and healthcheck fix ([af4ed4d](https://github.com/ihkaru/cerdas/commit/af4ed4d8ee8282d441e3e58ef76340a4db49de59))


### Bug Fixes

* convert debug menu to popup for Android scroll + fix CORS for capacitor ([49eb1e5](https://github.com/ihkaru/cerdas/commit/49eb1e59645c4dc2792f4c452613bf6e2584c46a))

## [0.1.10](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.9...cerdas-v0.1.10) (2026-02-11)


### Bug Fixes

* **client:** log actual origin for CORS debugging ([b78219d](https://github.com/ihkaru/cerdas/commit/b78219d51bf0c8d05ba4f45ed6809b4945b1cd17))

## [0.1.9](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.8...cerdas-v0.1.9) (2026-02-11)


### Features

* **client:** comprehensive 4-layer network diagnostics in HealthCheckService ([2a5232b](https://github.com/ihkaru/cerdas/commit/2a5232b7cbb07ea86d1d5553e7edc8d726b1c38f))

## [0.1.8](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.7...cerdas-v0.1.8) (2026-02-11)


### Features

* **backend:** add SHA-256 fingerprint to assetlinks.json for Google Login ([530c88d](https://github.com/ihkaru/cerdas/commit/530c88dd421240bd382eb82dbb358a56c222571d))

## [0.1.7](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.6...cerdas-v0.1.7) (2026-02-11)


### Bug Fixes

* **ci:** fail build if signing missing and verify keystore file ([a95952a](https://github.com/ihkaru/cerdas/commit/a95952a0cf668a32b68926cb51ac024fffd30cae))

## [0.1.6](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.5...cerdas-v0.1.6) (2026-02-11)


### Bug Fixes

* **android:** repair build.gradle syntax ([551798d](https://github.com/ihkaru/cerdas/commit/551798d9ed450ee3c83497d11c989728c929d8ad))
* **ci:** simplify discord notification to avoid length limit ([637a0b6](https://github.com/ihkaru/cerdas/commit/637a0b6da37747e8138d074ead415effe4fec7bc))

## [0.1.5](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.4...cerdas-v0.1.5) (2026-02-11)


### Features

* add GitHub Actions workflow for automated releases and Android build triggering ([4c14788](https://github.com/ihkaru/cerdas/commit/4c14788fa51bdc4e6baa032864d10f2f548bc530))


### Bug Fixes

* **ci:** declare secrets in workflow_call definition ([fae1104](https://github.com/ihkaru/cerdas/commit/fae1104d89ae99b4a7dcd559668c001e20fa63bd))
* **ci:** grant write permissions to release-please ([511e96e](https://github.com/ihkaru/cerdas/commit/511e96e4bf14f03784ff2622c8b200af6916629d))
* **ci:** remove reserved GITHUB_TOKEN from workflow_call definition ([5d201d8](https://github.com/ihkaru/cerdas/commit/5d201d8d26819fb870c58a3e65b72ddecc085524))
* **ci:** restore github token and fix yaml syntax ([8caacfc](https://github.com/ihkaru/cerdas/commit/8caacfc6d468558412ff094a2b8ed6a04d754d96))
* **ci:** restore workflow_dispatch trigger ([127bec2](https://github.com/ihkaru/cerdas/commit/127bec2c29492fd53bfc9a9496c174e69149856d))
* **ci:** use env var for discord checking ([71a2aaa](https://github.com/ihkaru/cerdas/commit/71a2aaa961e1a6e3beb71e1f5877f242c5922844))

## [0.1.4](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.3...cerdas-v0.1.4) (2026-02-11)


### Features

* **client:** add advanced connection probe and fix ApiClient ([0104819](https://github.com/ihkaru/cerdas/commit/0104819eaac8859d03e0ca1833b29f410cc1004f))


### Bug Fixes

* **backend:** add android origins to cors allow list ([1e55611](https://github.com/ihkaru/cerdas/commit/1e5561117954e3d2aaca45c3dffbd4465369ca2e))

## [0.1.3](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.2...cerdas-v0.1.3) (2026-02-11)


### Bug Fixes

* **ci:** show full keytool output to avoid grep exit code failure ([f891c18](https://github.com/ihkaru/cerdas/commit/f891c18fcff87b67db6556f26f025bdc6bb88835))

## [0.1.2](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.1...cerdas-v0.1.2) (2026-02-11)


### Features

* **ci:** automate android build trigger from release-please ([23b5a60](https://github.com/ihkaru/cerdas/commit/23b5a607615898c89e0e766c71387044b5585ef8))


### Bug Fixes

* **client:** improve debug menu scrolling on android ([67d1d3a](https://github.com/ihkaru/cerdas/commit/67d1d3a8a1bac292dfa4dd3aed10623632d93dbf))
* **prod:** improve android debug scrolling and health check, add assetlinks, print sha256 in ci ([77be455](https://github.com/ihkaru/cerdas/commit/77be4559f6224b3b415d8bcb801d286e362d3020))

## [0.1.1](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.0...cerdas-v0.1.1) (2026-02-11)


### Features

* Add Android production build automation workflow ([f34bed8](https://github.com/ihkaru/cerdas/commit/f34bed858f53e3dbe1f3f81b41a87e411226b68c))
* Add Docker production setup and Coolify deployment guide ([a506f8d](https://github.com/ihkaru/cerdas/commit/a506f8d010eabfc782d4eeab66c836d071ac9754))
* add GitHub Actions workflow for automated APK builds and releases ([d3f1527](https://github.com/ihkaru/cerdas/commit/d3f15278980a8e3262a80e0b14ae488b2e12e064))
* add Octane safety audit workflow and script ([fa2915c](https://github.com/ihkaru/cerdas/commit/fa2915c9c6f36fb6b68472147f356f87f7aabf1d))
* Android production build config and guide ([de2d1a4](https://github.com/ihkaru/cerdas/commit/de2d1a4037d46efbed7f1c4b154e6bc48272e6b4))
* automated code quality CI — ESLint (Vue/TS) + Laravel Pint + PHPMD on every push ([278ac4d](https://github.com/ihkaru/cerdas/commit/278ac4d7cc8c09e9a7933ccf8577596505a46f06))
* automated versioning with release-please + commitlint ([a09725c](https://github.com/ihkaru/cerdas/commit/a09725ce1026ab14014b8f425102a7fb33b14035))
* **ci:** add pre-push build verification hook ([8954cb0](https://github.com/ihkaru/cerdas/commit/8954cb0fb1db45209d660ac98e8d91dcc5d3eb55))
* **ci:** upgrade pre-push hook to full Android build verification ([12615ac](https://github.com/ihkaru/cerdas/commit/12615ac15018489ee4014b772d280bea6776f4a2))
* enhanced debug menu with runtime log viewer and auth state ([44b33c0](https://github.com/ihkaru/cerdas/commit/44b33c0fc3378ce57daa22f1d845563e56d957ba))
* Fix invitation logic, shared assignment access, and instant sync ([6feb1f4](https://github.com/ihkaru/cerdas/commit/6feb1f4ef626f3e2f3f8b3bcb78d4c2400dbae43))
* implement resizable panels for editor UI (views, actions, fields, data) ([b902607](https://github.com/ihkaru/cerdas/commit/b902607c13b3ab16406d0f925e1a74649f49299e))
* Integrate GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID into production build ([bcd5c38](https://github.com/ihkaru/cerdas/commit/bcd5c38da0a5b632df9f1f9bf03d8860aef12425))
* **lint:** add TypeScript anti-pattern rules — eqeqeq, no-explicit-any, no-non-null-assertion ([17b8957](https://github.com/ihkaru/cerdas/commit/17b895758269391d581b0c560e91098fc280edc8))
* migrate backend to Laravel Octane + FrankenPHP worker mode ([92c2e2c](https://github.com/ihkaru/cerdas/commit/92c2e2cf608fd51c8fea29792e37719ebc1e007a))
* professional README + secret leak detection CI + git history cleanup tool ([70a4f8a](https://github.com/ihkaru/cerdas/commit/70a4f8a0c54987b23637063e6d8f27a710136c4c))
* unified versioning, production health check, smart pre-push hook ([2afcd0a](https://github.com/ihkaru/cerdas/commit/2afcd0a2fb4bc773616d168c2ffed2ae86448bbd))


### Bug Fixes

* Add coolify network to docker-compose for database connection ([64b84d3](https://github.com/ihkaru/cerdas/commit/64b84d3557ac60ede01315d8d6d35c59caa83a4f))
* Add missing GOOGLE_CLIENT_ID to scheduler service (correction) ([4c34a68](https://github.com/ihkaru/cerdas/commit/4c34a68cdc11f100f3364340de08b69d7890594a))
* **android:** robust signing config loading to prevent local build failures ([5b9e658](https://github.com/ihkaru/cerdas/commit/5b9e6584ce8094f985506ae923ad2b76c6df8fb0))
* Backend Dockerfile extensions and composer flags to fix build ([1ca1d1a](https://github.com/ihkaru/cerdas/commit/1ca1d1ad414463c0cec341744e2a52a7e3fe72aa))
* **backend:** add trim to CORS allowed origins explode logic ([86a2065](https://github.com/ihkaru/cerdas/commit/86a206545119bb07e8f7ef7a6532078b6932545d))
* **backend:** allow CORS on all paths ([69a8507](https://github.com/ihkaru/cerdas/commit/69a8507ebd71fb8e85992de05768b05aa8be1907))
* **backend:** run package discovery and optimization at runtime in docker entrypoint ([865b4a2](https://github.com/ihkaru/cerdas/commit/865b4a259fe6eeac2b747094b4dd3383840113d1))
* **backend:** skip scripts in composer dump-autoload during docker build ([da6b4ff](https://github.com/ihkaru/cerdas/commit/da6b4ff73bb40ad6ee1186384840d8892543816c))
* **backend:** use environment variable for CORS allowed origins to resolve production connectivity issues ([4a9d18e](https://github.com/ihkaru/cerdas/commit/4a9d18e0899ed461668b1181ad50953e6f542ced))
* **ci:** add cap add android before sync (android/ is gitignored) ([3f20bd7](https://github.com/ihkaru/cerdas/commit/3f20bd7175782e811a941523e8b8534ad8613960))
* **ci:** add contents: write permission for GitHub release ([9bf92ca](https://github.com/ihkaru/cerdas/commit/9bf92caa19e01c9a404b167836360fc51e092f35))
* **ci:** add pnpm caching, fix heredoc quoting, add PR paths filter ([fade3e0](https://github.com/ihkaru/cerdas/commit/fade3e023645e5e463e5b37ddc163c1495c466d7))
* **ci:** bump Java 17-&gt;21 for Capacitor Android source release compatibility ([6c233f8](https://github.com/ihkaru/cerdas/commit/6c233f8fcd724b4b9bd546fa37b303f8f324763a))
* **ci:** bump Node.js from 20 to 22 for Capacitor CLI compatibility ([befb948](https://github.com/ihkaru/cerdas/commit/befb948d668142ea0b412c302ea41562a7bac36a))
* **ci:** disable composer scripts in code quality workflow to prevent env errors ([734526d](https://github.com/ihkaru/cerdas/commit/734526daef0a9c2ead346c64e92c8e16e44cce71))
* **ci:** enable android native build in CI ([c038dd5](https://github.com/ihkaru/cerdas/commit/c038dd563471ab41bf4a7c31e07f0da08ed2cacc))
* **ci:** remove explicit pnpm version to avoid conflict with packageManager ([65c00f2](https://github.com/ihkaru/cerdas/commit/65c00f249a674f5c21e135efc09fa1e27b5f15b0))
* **client:** resolve lint warnings in AppGallery.vue ([ae5e0d2](https://github.com/ihkaru/cerdas/commit/ae5e0d225495fbbe96fbe48ffba25ec3d0ac7800))
* debug menu rendering on Android - use plain HTML instead of F7 slots ([fc5737a](https://github.com/ihkaru/cerdas/commit/fc5737ace060596dee73183f3ac21f8ee5bf5e3f))
* **docker:** add Composer to FrankenPHP image (exit code 127 = command not found) ([e7e4033](https://github.com/ihkaru/cerdas/commit/e7e40335efc8a2443c9a392f21668c884865ca37))
* **docker:** add missing APP_KEY and APP_URL to worker and scheduler services ([08bc5d8](https://github.com/ihkaru/cerdas/commit/08bc5d8095bad485d80dae003c8a12358872c221))
* **docker:** change backend expose port from 80 to 8080 to match serversideup image ([f2fad8a](https://github.com/ihkaru/cerdas/commit/f2fad8ae4ca07f995c5105bc0e7a8e63f93b28ba))
* **editor:** normalize api base url to prevent double path in echo config ([29e0028](https://github.com/ihkaru/cerdas/commit/29e0028facd0d18a1879c8a1045409760cc14181))
* Frontend Dockerfile COPY dist path for monorepo context ([00ddaa4](https://github.com/ihkaru/cerdas/commit/00ddaa454c762132481086f534bab1b9716ca981))
* Frontend Dockerfile COPY nginx.conf path for monorepo context ([beab238](https://github.com/ihkaru/cerdas/commit/beab23826d6d11e9b467e9a40283210049f7f8ea))
* Frontend Dockerfile monorepo build context and pnpm support ([37c9a12](https://github.com/ihkaru/cerdas/commit/37c9a12990ed8ba5361090c67019c3116cae3b16))
* Frontend Dockerfile skip vue-tsc typecheck for production build reliability ([e41cb05](https://github.com/ihkaru/cerdas/commit/e41cb05439b21f267143b1a5b39acc766704df2c))
* **lint:** replace == with === using String() coercion for ID comparisons ([da35a04](https://github.com/ihkaru/cerdas/commit/da35a045bf12a3e0010d878bcb45047fbcb53a71))
* LivePreview URL client-&gt;app, enable FrankenPHP worker mode with --workers=auto ([184f392](https://github.com/ihkaru/cerdas/commit/184f3928ac73f5e6b5fb05f064470d383e66bc6b))
* regenerate pnpm-lock.yaml after turbo removal ([f2cacf8](https://github.com/ihkaru/cerdas/commit/f2cacf86fb7d22ce139cd0e3ba44b301167718a8))
* Replace hardcoded API and Client URLs with environment variables to resolve production CORS issues ([34b1638](https://github.com/ihkaru/cerdas/commit/34b1638b5b6246c41488f158e3d1669006180e0c))
* Resolve Broadcast Auth 500/401 errors & Editor Versioning redundant drafts ([2c04279](https://github.com/ihkaru/cerdas/commit/2c042799daafa1c5c557cdbec46c30d5cb1a090c))
* resolve vue v-if/v-for conflict and enable pre-commit hooks ([0cab18e](https://github.com/ihkaru/cerdas/commit/0cab18e27566166f7d5b359d3f333c362437c712))
* **sync:** resolve rollback versioning issue and add comprehensive debug logs ([5573a98](https://github.com/ihkaru/cerdas/commit/5573a98e6203273421d3b7fa1adecf9018feee68))


### Performance Improvements

* enable OPcache, fix healthcheck, optimize Dockerfile for production ([158530f](https://github.com/ihkaru/cerdas/commit/158530fc8c4a3a41609b2d706dba71bd826c03d5))

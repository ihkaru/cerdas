# Changelog

## [0.2.6](https://github.com/ihkaru/cerdas/compare/cerdas-v0.2.5...cerdas-v0.2.6) (2026-07-07)


### Bug Fixes

* **sync:** upsert tables row to fix fresh android install showing no assignments ([8d4eaa0](https://github.com/ihkaru/cerdas/commit/8d4eaa0c07320c666ec2be9b11a4c0063bfedd94))

## [0.2.5](https://github.com/ihkaru/cerdas/compare/cerdas-v0.2.4...cerdas-v0.2.5) (2026-07-07)


### Bug Fixes

* **backend:** use hasAppAccess and getAccessibleAppIds to support organization app access on tables, assignments, and dashboard ([17e7ac3](https://github.com/ihkaru/cerdas/commit/17e7ac36535aafcf998ba7a71ecb5bcce491b442))
* **client:** sync using resolvedAppId instead of contextId to resolve table vs app id mismatch ([97d36f5](https://github.com/ihkaru/cerdas/commit/97d36f57c8134abfaf9cbc92aebb44d5fa869947))

## [0.2.4](https://github.com/ihkaru/cerdas/compare/cerdas-v0.2.3...cerdas-v0.2.4) (2026-07-07)


### Features

* Add Android production build automation workflow ([f34bed8](https://github.com/ihkaru/cerdas/commit/f34bed858f53e3dbe1f3f81b41a87e411226b68c))
* Add Docker production setup and Coolify deployment guide ([a506f8d](https://github.com/ihkaru/cerdas/commit/a506f8d010eabfc782d4eeab66c836d071ac9754))
* add GitHub Actions workflow for automated APK builds and releases ([d3f1527](https://github.com/ihkaru/cerdas/commit/d3f15278980a8e3262a80e0b14ae488b2e12e064))
* add GitHub Actions workflow for automated releases and Android build triggering ([4c14788](https://github.com/ihkaru/cerdas/commit/4c14788fa51bdc4e6baa032864d10f2f548bc530))
* add hybrid dev workflow (local frontend + docker backend) ([4616e04](https://github.com/ihkaru/cerdas/commit/4616e04650315efaec55291d911d0daeb0c1466e))
* add Octane safety audit workflow and script ([fa2915c](https://github.com/ihkaru/cerdas/commit/fa2915c9c6f36fb6b68472147f356f87f7aabf1d))
* Android production build config and guide ([de2d1a4](https://github.com/ihkaru/cerdas/commit/de2d1a4037d46efbed7f1c4b154e6bc48272e6b4))
* **android:** implement dev/prod build variants ([6d130b7](https://github.com/ihkaru/cerdas/commit/6d130b7b831dda9c1d1a11bb3524c0ff9a5e36be))
* automated code quality CI — ESLint (Vue/TS) + Laravel Pint + PHPMD on every push ([278ac4d](https://github.com/ihkaru/cerdas/commit/278ac4d7cc8c09e9a7933ccf8577596505a46f06))
* automated versioning with release-please + commitlint ([a09725c](https://github.com/ihkaru/cerdas/commit/a09725ce1026ab14014b8f425102a7fb33b14035))
* **backend:** add SHA-256 fingerprint to assetlinks.json for Google Login ([530c88d](https://github.com/ihkaru/cerdas/commit/530c88dd421240bd382eb82dbb358a56c222571d))
* **backend:** auto-run migrations on production startup ([a39af5c](https://github.com/ihkaru/cerdas/commit/a39af5c54f871ec6c13e97ceee0a0dc798927755))
* bypass 2000 record limit via cursor pagination for mobile sync ([32279f3](https://github.com/ihkaru/cerdas/commit/32279f38e8859add95a9f33fef0530396afd4fa9))
* **ci:** add audit-deployment script to prevent config errors ([2e02c96](https://github.com/ihkaru/cerdas/commit/2e02c96600a7dcbb99447bfb6c4180013e826f20))
* **ci:** add discord notification support ([12b87c2](https://github.com/ihkaru/cerdas/commit/12b87c21f2380e28349649c6734ad1be46595c5d))
* **ci:** add pre-push build verification hook ([8954cb0](https://github.com/ihkaru/cerdas/commit/8954cb0fb1db45209d660ac98e8d91dcc5d3eb55))
* **ci:** add release link to discord notification ([aac2134](https://github.com/ihkaru/cerdas/commit/aac21340aaad10ac6cb800f4050d7805839b24ac))
* **ci:** automate android build trigger from release-please ([23b5a60](https://github.com/ihkaru/cerdas/commit/23b5a607615898c89e0e766c71387044b5585ef8))
* **ci:** expand audit checks for app_debug, env, and db_host ([add4cfb](https://github.com/ihkaru/cerdas/commit/add4cfb4e06efda2ce9782f7c2211e9ecd374da9))
* **ci:** upgrade pre-push hook to full Android build verification ([12615ac](https://github.com/ihkaru/cerdas/commit/12615ac15018489ee4014b772d280bea6776f4a2))
* **client:** add advanced connection probe and fix ApiClient ([0104819](https://github.com/ihkaru/cerdas/commit/0104819eaac8859d03e0ca1833b29f410cc1004f))
* **client:** comprehensive 4-layer network diagnostics in HealthCheckService ([2a5232b](https://github.com/ihkaru/cerdas/commit/2a5232b7cbb07ea86d1d5553e7edc8d726b1c38f))
* **client:** implement async map rendering engine and simple memory optimizations ([01ed9df](https://github.com/ihkaru/cerdas/commit/01ed9df32694fc4c90349402d06c55d6febfa57d))
* **client:** remove pagination from assignment list ([23505ed](https://github.com/ihkaru/cerdas/commit/23505ed0ed00722c46d0ecc40505ac4667d4094e))
* **client:** update header title to use view name ([2731b92](https://github.com/ihkaru/cerdas/commit/2731b92cd27854b0378c08bc4ab70ca476b21314))
* complete excel import robustness and cleanup backend styles ([7be6944](https://github.com/ihkaru/cerdas/commit/7be69446d1b74ecc4ff25d8a138608af8a1bbf0d))
* complete excel import robustness with batch splitting and job logging ([0cb12b7](https://github.com/ihkaru/cerdas/commit/0cb12b7148ca4f8a99c316c6db6bfc32305c4dfc))
* complete local dev features and docker optimization ([3679883](https://github.com/ihkaru/cerdas/commit/3679883597e3a6d34b8683b49b1168916c079d2b))
* **dev:** dual android dev modes, cors fix, and healthcheck fix ([af4ed4d](https://github.com/ihkaru/cerdas/commit/af4ed4d8ee8282d441e3e58ef76340a4db49de59))
* **docker:** optimize backend with frankenphp static binary and fix port conflicts ([36a6112](https://github.com/ihkaru/cerdas/commit/36a6112d7908bfe4d021eec27b6ff8e9da626e3e))
* **editor:** implement schema reference, copy fallback, and validation for logic editors ([3f216ca](https://github.com/ihkaru/cerdas/commit/3f216ca1536590f9ec017e66a60e713b93be57ac))
* **editor:** improve UX hierarchy and optimize map view ([b5121e0](https://github.com/ihkaru/cerdas/commit/b5121e04265d5db4b2cb3284687bf400700c9472))
* enhanced debug menu with runtime log viewer and auth state ([44b33c0](https://github.com/ihkaru/cerdas/commit/44b33c0fc3378ce57daa22f1d845563e56d957ba))
* Fix invitation logic, shared assignment access, and instant sync ([6feb1f4](https://github.com/ihkaru/cerdas/commit/6feb1f4ef626f3e2f3f8b3bcb78d4c2400dbae43))
* **form-engine/editor:** standardize hint, refactor DateField UI, add read-only toggle ([ed8538c](https://github.com/ihkaru/cerdas/commit/ed8538c9823b3797fd73f80b59f4ee012d9dce1e))
* **form-engine:** add direct google maps directions link to smart detection tip ([c139f52](https://github.com/ihkaru/cerdas/commit/c139f52d3f17fd1e2fd16bdbafc9971f22f057f1))
* implement resizable panels for editor UI (views, actions, fields, data) ([b902607](https://github.com/ihkaru/cerdas/commit/b902607c13b3ab16406d0f925e1a74649f49299e))
* implement scalable async csv export with host-agnostic signed urls, data merging, and infrastructure hardening for 2026 standards (finalized & linted) ([2e5ca4f](https://github.com/ihkaru/cerdas/commit/2e5ca4f638ec2af16253fcc5968457a248fea418))
* implement shareable join links and modernize google auth (April 2026 standards) ([aaa17ec](https://github.com/ihkaru/cerdas/commit/aaa17ec6ce10b5f98902f57af060b38030575840))
* implement user isolation and data purging on account swap ([f22498c](https://github.com/ihkaru/cerdas/commit/f22498c7718b17f3f14e26a900cf3e8734dcdddd))
* Integrate GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID into production build ([bcd5c38](https://github.com/ihkaru/cerdas/commit/bcd5c38da0a5b632df9f1f9bf03d8860aef12425))
* **lint:** add TypeScript anti-pattern rules — eqeqeq, no-explicit-any, no-non-null-assertion ([17b8957](https://github.com/ihkaru/cerdas/commit/17b895758269391d581b0c560e91098fc280edc8))
* migrate backend to Laravel Octane + FrankenPHP worker mode ([92c2e2c](https://github.com/ihkaru/cerdas/commit/92c2e2cf608fd51c8fea29792e37719ebc1e007a))
* monorepo lint cleanup and final push for update system ([8148527](https://github.com/ihkaru/cerdas/commit/8148527947e1ab86560aa4086c065a2eadba09cc))
* optimize map view, add google basemap toggle, and fix pagination ([4818e20](https://github.com/ihkaru/cerdas/commit/4818e2096add1ddd9e2ec30fba3d55ba9ee707df))
* professional README + secret leak detection CI + git history cleanup tool ([70a4f8a](https://github.com/ihkaru/cerdas/commit/70a4f8a0c54987b23637063e6d8f27a710136c4c))
* safe deletion, trash management, and TS strict fixes ([813ca49](https://github.com/ihkaru/cerdas/commit/813ca4956ea07170831632195401314654454624))
* stabilize editor and preview sync ([884475b](https://github.com/ihkaru/cerdas/commit/884475bef72ffc613138063cd219f825c7336374))
* stabilize editor publish flow and enhance live preview sync ([0464ba0](https://github.com/ihkaru/cerdas/commit/0464ba059a50350ae5382d2990119e302050c241))
* **tools:** add script to generate consolidated docker context ([0d9fb9a](https://github.com/ihkaru/cerdas/commit/0d9fb9a5a748a676a014f4806622db7debc7c38a))
* unified versioning, production health check, smart pre-push hook ([2afcd0a](https://github.com/ihkaru/cerdas/commit/2afcd0a2fb4bc773616d168c2ffed2ae86448bbd))
* unify status terms, add dynamic json filters, auto-sync push on complete, and fix layout overlaps ([21adf01](https://github.com/ihkaru/cerdas/commit/21adf01e3627e28e685bd9f2c4ec5eef6a086a13))


### Bug Fixes

* Add coolify network to docker-compose for database connection ([64b84d3](https://github.com/ihkaru/cerdas/commit/64b84d3557ac60ede01315d8d6d35c59caa83a4f))
* Add missing GOOGLE_CLIENT_ID to scheduler service (correction) ([4c34a68](https://github.com/ihkaru/cerdas/commit/4c34a68cdc11f100f3364340de08b69d7890594a))
* add production domains to CORS allowed origins ([c278777](https://github.com/ihkaru/cerdas/commit/c27877750cbeaae88c76a3d0890e4bc47c2465bb))
* add shared storage volume for production uploads ([912414d](https://github.com/ihkaru/cerdas/commit/912414dbb58099ce33d4c468298d313ac82f0542))
* **android:** production build uses static assets, dev scripts enbable live reload ([3221316](https://github.com/ihkaru/cerdas/commit/3221316bd63d0c871501433bc459553baa338198))
* **android:** repair build.gradle syntax ([551798d](https://github.com/ihkaru/cerdas/commit/551798d9ed450ee3c83497d11c989728c929d8ad))
* **android:** robust signing config loading to prevent local build failures ([5b9e658](https://github.com/ihkaru/cerdas/commit/5b9e6584ce8094f985506ae923ad2b76c6df8fb0))
* **auth:** add debug logging to Google Login to diagnose failure ([d669f2d](https://github.com/ihkaru/cerdas/commit/d669f2d88b06dfa24bfaf0051e8ae08b7b1a6ae0))
* Backend Dockerfile extensions and composer flags to fix build ([1ca1d1a](https://github.com/ihkaru/cerdas/commit/1ca1d1ad414463c0cec341744e2a52a7e3fe72aa))
* **backend:** add android origins to cors allow list ([1e55611](https://github.com/ihkaru/cerdas/commit/1e5561117954e3d2aaca45c3dffbd4465369ca2e))
* **backend:** add trim to CORS allowed origins explode logic ([86a2065](https://github.com/ihkaru/cerdas/commit/86a206545119bb07e8f7ef7a6532078b6932545d))
* **backend:** allow CORS on all paths ([69a8507](https://github.com/ihkaru/cerdas/commit/69a8507ebd71fb8e85992de05768b05aa8be1907))
* **backend:** increase upload memory limit and clarify health check timeout ([342acd5](https://github.com/ihkaru/cerdas/commit/342acd53123e3e0c9f7238614bccd3a0547af63a))
* **backend:** prepend HandleCors middleware to prevent intermittent CORS errors ([c47926c](https://github.com/ihkaru/cerdas/commit/c47926c917e07560d3a8bd048008c45c04461a9d))
* **backend:** prevent calling total() on cursor paginator log ([5770e4b](https://github.com/ihkaru/cerdas/commit/5770e4b69e0aab1f996a5da6d3548140cae14e7b))
* **backend:** run package discovery and optimization at runtime in docker entrypoint ([865b4a2](https://github.com/ihkaru/cerdas/commit/865b4a259fe6eeac2b747094b4dd3383840113d1))
* **backend:** skip scripts in composer dump-autoload during docker build ([da6b4ff](https://github.com/ihkaru/cerdas/commit/da6b4ff73bb40ad6ee1186384840d8892543816c))
* **backend:** use environment variable for CORS allowed origins to resolve production connectivity issues ([4a9d18e](https://github.com/ihkaru/cerdas/commit/4a9d18e0899ed461668b1181ad50953e6f542ced))
* **ci:** add cap add android before sync (android/ is gitignored) ([3f20bd7](https://github.com/ihkaru/cerdas/commit/3f20bd7175782e811a941523e8b8534ad8613960))
* **ci:** add contents: write permission for GitHub release ([9bf92ca](https://github.com/ihkaru/cerdas/commit/9bf92caa19e01c9a404b167836360fc51e092f35))
* **ci:** add pnpm caching, fix heredoc quoting, add PR paths filter ([fade3e0](https://github.com/ihkaru/cerdas/commit/fade3e023645e5e463e5b37ddc163c1495c466d7))
* **ci:** bump Java 17-&gt;21 for Capacitor Android source release compatibility ([6c233f8](https://github.com/ihkaru/cerdas/commit/6c233f8fcd724b4b9bd546fa37b303f8f324763a))
* **ci:** bump Node.js from 20 to 22 for Capacitor CLI compatibility ([befb948](https://github.com/ihkaru/cerdas/commit/befb948d668142ea0b412c302ea41562a7bac36a))
* **ci:** declare secrets in workflow_call definition ([fae1104](https://github.com/ihkaru/cerdas/commit/fae1104d89ae99b4a7dcd559668c001e20fa63bd))
* **ci:** disable composer scripts in code quality workflow to prevent env errors ([734526d](https://github.com/ihkaru/cerdas/commit/734526daef0a9c2ead346c64e92c8e16e44cce71))
* **ci:** enable android native build in CI ([c038dd5](https://github.com/ihkaru/cerdas/commit/c038dd563471ab41bf4a7c31e07f0da08ed2cacc))
* **ci:** fail build if signing missing and verify keystore file ([a95952a](https://github.com/ihkaru/cerdas/commit/a95952a0cf668a32b68926cb51ac024fffd30cae))
* **ci:** grant write permissions to release-please ([511e96e](https://github.com/ihkaru/cerdas/commit/511e96e4bf14f03784ff2622c8b200af6916629d))
* **ci:** remove explicit pnpm version to avoid conflict with packageManager ([65c00f2](https://github.com/ihkaru/cerdas/commit/65c00f249a674f5c21e135efc09fa1e27b5f15b0))
* **ci:** remove reserved GITHUB_TOKEN from workflow_call definition ([5d201d8](https://github.com/ihkaru/cerdas/commit/5d201d8d26819fb870c58a3e65b72ddecc085524))
* **ci:** remove unused interfaces and resolve type mismatch ([b736abe](https://github.com/ihkaru/cerdas/commit/b736abef7223bbafd82a4f6ac6dcf50127f487aa))
* **ci:** resolve module resolution issues and discord notification character limits ([1da12e5](https://github.com/ihkaru/cerdas/commit/1da12e56817d05c4d8b14f6a2a7eb93d3b78940b))
* **ci:** restore github token and fix yaml syntax ([8caacfc](https://github.com/ihkaru/cerdas/commit/8caacfc6d468558412ff094a2b8ed6a04d754d96))
* **ci:** restore workflow_dispatch trigger ([127bec2](https://github.com/ihkaru/cerdas/commit/127bec2c29492fd53bfc9a9496c174e69149856d))
* **ci:** show full keytool output to avoid grep exit code failure ([f891c18](https://github.com/ihkaru/cerdas/commit/f891c18fcff87b67db6556f26f025bdc6bb88835))
* **ci:** simplify discord notification to avoid length limit ([637a0b6](https://github.com/ihkaru/cerdas/commit/637a0b6da37747e8138d074ead415effe4fec7bc))
* **ci:** use env var for discord checking ([71a2aaa](https://github.com/ihkaru/cerdas/commit/71a2aaa961e1a6e3beb71e1f5877f242c5922844))
* **client:** correctly parse auth/me payload in verifySession ([b5b98bd](https://github.com/ihkaru/cerdas/commit/b5b98bda2bca2411b5a53ec5a7a633e8c38e092a))
* **client:** enable grouping transition animation across levels ([2dcc456](https://github.com/ihkaru/cerdas/commit/2dcc45601f45c28e9181c06f3ac18ffea2c47f7e))
* **client:** enhance google login error logging and alert ([5079898](https://github.com/ihkaru/cerdas/commit/50798982aeeda7a6eb7434011610c6b9bc4623c1))
* **client:** ensure sync updates correct local table record ([c675019](https://github.com/ihkaru/cerdas/commit/c6750197bc1a6d0bfed3b8eacefe9f6caecdffec))
* **client:** import App type in DashboardRepository ([f08d5b4](https://github.com/ihkaru/cerdas/commit/f08d5b4af3ee90bb52ae8dfc2b08beaa3c3e0858))
* **client:** improve debug menu scrolling on android ([67d1d3a](https://github.com/ihkaru/cerdas/commit/67d1d3a8a1bac292dfa4dd3aed10623632d93dbf))
* **client:** log actual origin for CORS debugging ([b78219d](https://github.com/ihkaru/cerdas/commit/b78219d51bf0c8d05ba4f45ed6809b4945b1cd17))
* **client:** optimize map cluster memory & enable largeHeap for stability ([9785eff](https://github.com/ihkaru/cerdas/commit/9785eff42ce4be371824098b4fbde34d3b4b0add))
* **client:** recreate sqlite schema instantly during local db reset to prevent no such table errors ([186599b](https://github.com/ihkaru/cerdas/commit/186599bff93e692668823c68a4ad94b54fbfc694))
* **client:** remove commented out code in SyncService.ts to satisfy CI linter ([5ad5749](https://github.com/ihkaru/cerdas/commit/5ad5749ec848ecb8c44571592b3292c7886273ae))
* **client:** rename unused variable in AppGallery ([b2a3450](https://github.com/ihkaru/cerdas/commit/b2a3450646c1e58de9d0447c69c855d1e68f1da9))
* **client:** resolve assignment detail empty data race condition and other improvements ([8d829eb](https://github.com/ihkaru/cerdas/commit/8d829ebfdf8e7fc8f8a541379487adb6d94dd80d))
* **client:** resolve lint warnings in AppGallery.vue ([ae5e0d2](https://github.com/ihkaru/cerdas/commit/ae5e0d225495fbbe96fbe48ffba25ec3d0ac7800))
* **client:** resolve SyncService type errors blocking build ([c7d6dbd](https://github.com/ihkaru/cerdas/commit/c7d6dbdf0e02ff43493876edc5fd6d89559958c5))
* **client:** resolve TypeScript error in useAppShellLogic ([3217cd2](https://github.com/ihkaru/cerdas/commit/3217cd239559424ecf0e907e1bf7cc8fb164d988))
* **client:** router syntax error ([d5a32d6](https://github.com/ihkaru/cerdas/commit/d5a32d6aa5ecad5fe397543a2201133cec86eab0))
* **client:** secure join flow against ghost login and double clicks ([31d4fbf](https://github.com/ihkaru/cerdas/commit/31d4fbf1218bffa4c4dddb0733bb64eb481b9ea0))
* **client:** skip preview auto-sync on startup in iframe and fix health check endpoint ([e3d6bbd](https://github.com/ihkaru/cerdas/commit/e3d6bbd843c4ec3e08fe0ad7732cd017b840541a))
* **client:** unregister leftover service workers to resolve update loop ([9e19cac](https://github.com/ihkaru/cerdas/commit/9e19cac515be6a6859c460bf284b1586eefe7c6c))
* convert debug menu to popup for Android scroll + fix CORS for capacitor ([49eb1e5](https://github.com/ihkaru/cerdas/commit/49eb1e59645c4dc2792f4c452613bf6e2584c46a))
* correctly type and disable lint warnings for GpsField ([32c2f52](https://github.com/ihkaru/cerdas/commit/32c2f527d91bae34e24c46c984cdbdf6770f186f))
* critical bug in SyncService orphan cleanup destroying all synced assignments ([61cdc47](https://github.com/ihkaru/cerdas/commit/61cdc4797ca509b41180354851e4703932f39317))
* **dashboard:** resolve assignment filter/sort status counts, z-index, and search bugs ([5188b37](https://github.com/ihkaru/cerdas/commit/5188b37ed871f514cebedfea99657a9bc6ae2b33))
* debug menu rendering on Android - use plain HTML instead of F7 slots ([fc5737a](https://github.com/ihkaru/cerdas/commit/fc5737ace060596dee73183f3ac21f8ee5bf5e3f))
* **docker:** add Composer to FrankenPHP image (exit code 127 = command not found) ([e7e4033](https://github.com/ihkaru/cerdas/commit/e7e40335efc8a2443c9a392f21668c884865ca37))
* **docker:** add missing APP_KEY and APP_URL to worker and scheduler services ([08bc5d8](https://github.com/ihkaru/cerdas/commit/08bc5d8095bad485d80dae003c8a12358872c221))
* **docker:** add missing traefik.docker.network label to fix 504 on editor/client ([2095276](https://github.com/ihkaru/cerdas/commit/209527607bbe79fa29e6827a04470826f935f269))
* **docker:** audit production setup, fix CORS, remove redundancies ([ede4052](https://github.com/ihkaru/cerdas/commit/ede4052f9073569812fab8888c9c574747988223))
* **docker:** change backend expose port from 80 to 8080 to match serversideup image ([f2fad8a](https://github.com/ihkaru/cerdas/commit/f2fad8ae4ca07f995c5105bc0e7a8e63f93b28ba))
* **docker:** enable local dev with database and proper build context ([ae3502f](https://github.com/ihkaru/cerdas/commit/ae3502f12eb119c67d49e267e25003d8056ae11c))
* **docker:** expand .dockerignore to exclude 38MB APK and build artifacts, update COOLIFY_GUIDE ([11c0d00](https://github.com/ihkaru/cerdas/commit/11c0d008449a143d0f9da9ae84fc2e55f99614f9))
* **editor:** add missing marker_style_fn to ViewDefinition type ([a762d40](https://github.com/ihkaru/cerdas/commit/a762d40f171aa4eb71b636cffafe428cbd786e5b))
* **editor:** fix broken relative import paths in store tests ([4aaae56](https://github.com/ihkaru/cerdas/commit/4aaae5668f17854a893de965afab63b2dd1e477c))
* **editor:** fix toast.setText is not a function in pollExportStatus ([d3dd3ad](https://github.com/ihkaru/cerdas/commit/d3dd3ad3ec5b48e272df389f7ccd06795d204ad1))
* **editor:** Live Preview Reactivity, GroupBy Logic & UX ([6f489c2](https://github.com/ihkaru/cerdas/commit/6f489c2e7a07bc945891609dab8390fff2718aed))
* **editor:** normalize api base url to prevent double path in echo config ([29e0028](https://github.com/ihkaru/cerdas/commit/29e0028facd0d18a1879c8a1045409760cc14181))
* **editor:** satisfy SSOT by adding metadata for new field types ([a466f1c](https://github.com/ihkaru/cerdas/commit/a466f1c2720b70bcd3cb5ede07aa7e0132e24b75))
* enforce anti-cache headers for index.html in nginx.conf ([b4ee206](https://github.com/ihkaru/cerdas/commit/b4ee206c9e0abf03599d92863f0dc4b4b9a1ff87))
* final update system polish with hardened reload and native safety ([3f59698](https://github.com/ihkaru/cerdas/commit/3f5969848cd4fcc1979f37b9236e43f3975ea3b4))
* **form-engine:** fix unknown type error in geoUtils ([b11997e](https://github.com/ihkaru/cerdas/commit/b11997eb45f77f285bac2a2d94179a3f2a707633))
* **form-engine:** remove invalid timePicker24h property from calendar config ([46aa255](https://github.com/ihkaru/cerdas/commit/46aa255bc593c192ae6455fd79f542aef882a10a))
* **form-engine:** resolve build errors in DateField.vue (unused vars and type mismatch) ([5d5187b](https://github.com/ihkaru/cerdas/commit/5d5187bd0bd265fe266af987578d49629bfee288))
* **form-engine:** resolve gps field rendering issues and add smart coordinate detection ([81442af](https://github.com/ihkaru/cerdas/commit/81442af4e99bcd2d9535ae66a1657e0b89c0a642))
* **form-engine:** resolve vue module resolution and type declaration errors ([ed70b52](https://github.com/ihkaru/cerdas/commit/ed70b52510cd82c1f379b461a540927e00028f3d))
* Frontend Dockerfile COPY dist path for monorepo context ([00ddaa4](https://github.com/ihkaru/cerdas/commit/00ddaa454c762132481086f534bab1b9716ca981))
* Frontend Dockerfile COPY nginx.conf path for monorepo context ([beab238](https://github.com/ihkaru/cerdas/commit/beab23826d6d11e9b467e9a40283210049f7f8ea))
* Frontend Dockerfile monorepo build context and pnpm support ([37c9a12](https://github.com/ihkaru/cerdas/commit/37c9a12990ed8ba5361090c67019c3116cae3b16))
* Frontend Dockerfile skip vue-tsc typecheck for production build reliability ([e41cb05](https://github.com/ihkaru/cerdas/commit/e41cb05439b21f267143b1a5b39acc766704df2c))
* implement safety merge for CORS and Sanctum production domains ([e1c3fe5](https://github.com/ihkaru/cerdas/commit/e1c3fe5d95c2622475fdb4482195462bf38ebbbe))
* **lint:** replace == with === using String() coercion for ID comparisons ([da35a04](https://github.com/ihkaru/cerdas/commit/da35a045bf12a3e0010d878bcb45047fbcb53a71))
* **lint:** resolve remaining 20 lint errors and warnings ([be0b8d9](https://github.com/ihkaru/cerdas/commit/be0b8d969d10d60ab6edf858257ed94a2a547c42))
* LivePreview URL client-&gt;app, enable FrankenPHP worker mode with --workers=auto ([184f392](https://github.com/ihkaru/cerdas/commit/184f3928ac73f5e6b5fb05f064470d383e66bc6b))
* markdown formatting ([a73f850](https://github.com/ihkaru/cerdas/commit/a73f85035f0b2c6f368dccd470c457bf3083f4cc))
* monorepo build blockers and expression engine security suppression ([4cb7582](https://github.com/ihkaru/cerdas/commit/4cb75824c95a44e603462992c7ef96aa5c9a1445))
* **prod:** add traefik label to force port 80 to prevent 2019 misrouting ([800358e](https://github.com/ihkaru/cerdas/commit/800358e889c31251a1f13c6561b8197acf5e4792))
* **prod:** chown frankenphp binary to fix permission denied crash ([1b8fb90](https://github.com/ihkaru/cerdas/commit/1b8fb9044e67b611dd3d5b41a86ea65c4dc716ee))
* **prod:** correct frankenphp binary permissions and path ([7f5ca0b](https://github.com/ihkaru/cerdas/commit/7f5ca0b2919469c6c15ba3a4feb9b09aa52beae5))
* **prod:** disable healthcheck for worker/scheduler properly ([07b8edb](https://github.com/ihkaru/cerdas/commit/07b8edbac3860411b7a3e22aace83dc718430ce5))
* **prod:** exclude bootstrap/cache to prevent dev dependency crash ([685734e](https://github.com/ihkaru/cerdas/commit/685734e2ffa74a7a812d4198be80b2a3d3b0a14a))
* **prod:** final tuning - pin frankenphp 1.10, disable auto_https, clean startup ([4f25f06](https://github.com/ihkaru/cerdas/commit/4f25f06755181c0901c61fd82fc946925c0b4f1a))
* **prod:** force 127.0.0.1 for frontend healthchecks to bypass DNS-IPv6 issue ([7f8726f](https://github.com/ihkaru/cerdas/commit/7f8726fc61dc137f4d1b3173e186b45dd334d5d0))
* **prod:** harden config (reverb port, env vars, health conditions, traefik labels) ([b162cc3](https://github.com/ihkaru/cerdas/commit/b162cc3ce8b1b46c0317f442efe3c57ddfcb1968))
* **prod:** improve android debug scrolling and health check, add assetlinks, print sha256 in ci ([77be455](https://github.com/ihkaru/cerdas/commit/77be4559f6224b3b415d8bcb801d286e362d3020))
* **prod:** pin frankenphp, tune healthcheck, disable auto-download ([42cdfa0](https://github.com/ihkaru/cerdas/commit/42cdfa0f18ee4b0810904aab5a5fd71facf0d383))
* **prod:** remove unsupported --frankenphp-binary flag from octane command ([7c9c095](https://github.com/ihkaru/cerdas/commit/7c9c0950f31a8316f5b04d419246ebc6b8eb68dd))
* **prod:** rename Caddyfile to avoid windows path in docker ([93e43bd](https://github.com/ihkaru/cerdas/commit/93e43bd08d11e24d74dc5528959b00e625058761))
* **prod:** set OCTANE_SERVER_NAME=:80 to accept all host headers ([259eaa8](https://github.com/ihkaru/cerdas/commit/259eaa81defb2f8a543c08cdf660aaefc3afbada))
* **prod:** set ownership to 1000:1000 to match coolify user ([38dfcc6](https://github.com/ihkaru/cerdas/commit/38dfcc62fa37bf52c767c9b214c05471450f8942))
* **prod:** switch backend to port 80 to match coolify default ([aed36ee](https://github.com/ihkaru/cerdas/commit/aed36ee901acd1efeac2026e30727ce7dcece699))
* **prod:** sync EVERYTHING to port 8080 (app, traefik, healthcheck) to resolve 502 ([c1d4988](https://github.com/ihkaru/cerdas/commit/c1d4988ea04e31dd8a421be812b8256af0551b05))
* **prod:** tune healthchecks per coolify specs (exclude worker/scheduler) ([df78bbd](https://github.com/ihkaru/cerdas/commit/df78bbd45c3213aa34bc87f9063dfd934d889dc1))
* **prod:** update healthcheck endpoint to /up ([bf6ccee](https://github.com/ihkaru/cerdas/commit/bf6ccee7cc0f31f7516d434ce654142c8ff421c9))
* **prod:** upgrade frankenphp v2, force binary path, tune healthcheck ([f30039c](https://github.com/ihkaru/cerdas/commit/f30039c2da95e90b5b3a091a92b4a01ab279c43e))
* **prod:** use start-container.sh script for robust startup ([5902ffe](https://github.com/ihkaru/cerdas/commit/5902ffe077dba568427aeae20d6f17ccd4ae35e6))
* **queue:** extend worker max-time to 4h to prevent excel imports from crashing mid-execution ([59f4265](https://github.com/ihkaru/cerdas/commit/59f42652c502b8b4d51f0ffc60b8f2d3ca3fe7a4))
* **queue:** harden queue worker auto-restart script ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))
* regenerate pnpm-lock.yaml after turbo removal ([f2cacf8](https://github.com/ihkaru/cerdas/commit/f2cacf86fb7d22ce139cd0e3ba44b301167718a8))
* remove console.log to satisfy linter ([7e8477f](https://github.com/ihkaru/cerdas/commit/7e8477ff9070debce1968aa333d0055aca7be20c))
* remove unused ref import in useTableSelection.ts ([6e1f880](https://github.com/ihkaru/cerdas/commit/6e1f88028e8b60b0100f06192770bc2e0a0cfe59))
* Replace hardcoded API and Client URLs with environment variables to resolve production CORS issues ([34b1638](https://github.com/ihkaru/cerdas/commit/34b1638b5b6246c41488f158e3d1669006180e0c))
* Resolve Broadcast Auth 500/401 errors & Editor Versioning redundant drafts ([2c04279](https://github.com/ihkaru/cerdas/commit/2c042799daafa1c5c557cdbec46c30d5cb1a090c))
* resolve CI build failures (complexity and ignored exceptions) ([05546ab](https://github.com/ihkaru/cerdas/commit/05546ab003ba90d872bc8dd6f57aa8c9f22731fc))
* resolve CI build failures (unused variables and incorrect computed assignments) ([a83c0d1](https://github.com/ihkaru/cerdas/commit/a83c0d102b8b38d348a2c9455aeccbf886945765))
* resolve ESLint errors to pass GitHub Actions Code Quality checks ([97ca47c](https://github.com/ihkaru/cerdas/commit/97ca47c644bc97a20f07535557ea2c5782b0439c))
* resolve final runtime and typescript errors in editor ([50846be](https://github.com/ihkaru/cerdas/commit/50846be980ed74c3940f0bb36871e16909cc8953))
* resolve final sonarjs lint error in SubmissionsPanel for CI/CD pass ([40ffbe1](https://github.com/ihkaru/cerdas/commit/40ffbe1ed291559172aad55a24f874ddc2041b67))
* resolve final type errors in useAppMetadata.ts ([cbcd723](https://github.com/ihkaru/cerdas/commit/cbcd7239d160eb849c1b30a5803a4696a1819909))
* resolve lint errors and add local verify scripts ([64ce003](https://github.com/ihkaru/cerdas/commit/64ce0037661f1df049ac80f4da37e4f80e7803f9))
* resolve map navigation error, fix geoUtils type break, and enhance excel import ([256a6d3](https://github.com/ihkaru/cerdas/commit/256a6d3ca6a611e19cd7f54c4ffba50a137d117a))
* resolve MapView build break ([cb2827d](https://github.com/ihkaru/cerdas/commit/cb2827d88ca44c6b85bc23488346b8ee8420a97f))
* resolve PWA update loop with SKIP_WAITING and fix TypeScript editor compile issues ([be55f5c](https://github.com/ihkaru/cerdas/commit/be55f5cd7852d1e41b7aeaddf44df36236ef52a6))
* resolve remaining vue-tsc errors in useAppMetadata.ts ([aaaec1c](https://github.com/ihkaru/cerdas/commit/aaaec1c8a4c7073f4e0e9b1c37da53e5952d00ff))
* resolve synchronization 404s, editor save 400s, and dynamic join link domain ([ade7fe1](https://github.com/ihkaru/cerdas/commit/ade7fe1cb911a2d9778a1a227f9170dcec4b449a))
* resolve update loop by fixing version detection logic and adding logging ([d0f434d](https://github.com/ihkaru/cerdas/commit/d0f434d92f3d9b92e1c4deea52be4773bd799923))
* resolve vue v-if/v-for conflict and enable pre-commit hooks ([0cab18e](https://github.com/ihkaru/cerdas/commit/0cab18e27566166f7d5b359d3f333c362437c712))
* resolve vue-tsc build errors ([545a799](https://github.com/ihkaru/cerdas/commit/545a799016c2c1e5ead7324793bc1953bc52b4e6))
* stabilize dashboard sync and join flow cleanup ([996e318](https://github.com/ihkaru/cerdas/commit/996e318574974c67895497150c05d3760c8e755e))
* **sync,toggle:** fix infinite toggle loop and client app deletion sync ([018e373](https://github.com/ihkaru/cerdas/commit/018e3733d40660e10feeb9570207258d949c2085))
* **sync:** logic improvements and lint fixes ([1213977](https://github.com/ihkaru/cerdas/commit/121397743ae0601028f74b817fd70a589f5102fb))
* **sync:** resolve lint errors ([f78c3f0](https://github.com/ihkaru/cerdas/commit/f78c3f0e3dc27ea5c36a57c4b9dc21b4e0b25524))
* **sync:** resolve rollback versioning issue and add comprehensive debug logs ([5573a98](https://github.com/ihkaru/cerdas/commit/5573a98e6203273421d3b7fa1adecf9018feee68))
* total stabilization of app join and dashboard ([17d166b](https://github.com/ihkaru/cerdas/commit/17d166b5e6c9d65f25357c8a763d3cb4cfee3400))
* **workflow:** harden discord notification and clean up build artifacts ([faa7d1e](https://github.com/ihkaru/cerdas/commit/faa7d1ef2453f036e3704f14d37b2b0a1c58a3db))


### Performance Improvements

* **backend:** remove logging from auth check ([1606f89](https://github.com/ihkaru/cerdas/commit/1606f89fdb950b38d527cad2be11b7ff75598db3))
* **client:** improve app shell load performance and UX ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))
* **docker:** introduce BuildKit cache mounts for instant NPM/Composer instals ([da24cf8](https://github.com/ihkaru/cerdas/commit/da24cf85f27b6f51224cd8d3a9a9c20333aa5b26))
* **docker:** optimize chown execution for instant builds ([97a2c62](https://github.com/ihkaru/cerdas/commit/97a2c621620957c5f4eabe38dd339c1c39dcd32a))
* enable OPcache, fix healthcheck, optimize Dockerfile for production ([158530f](https://github.com/ihkaru/cerdas/commit/158530fc8c4a3a41609b2d706dba71bd826c03d5))
* **export:** optimize large dataset exports with lazy query loading and ZIP compression ([7d4c7f9](https://github.com/ihkaru/cerdas/commit/7d4c7f9ed44f531f1bf44ce08aca912f7c01fa64))
* **map:** optimize buildGeoJson and add clustering config ([61c8019](https://github.com/ihkaru/cerdas/commit/61c80194d168d90680152492b76731350e6db9c3))
* optimize backend (PHP 8.4, root JSON response) and sync versions ([56dca33](https://github.com/ihkaru/cerdas/commit/56dca33995333100faada82a7ba87a10658658c1))

## [0.2.2](https://github.com/ihkaru/cerdas/compare/cerdas-v0.2.1...cerdas-v0.2.2) (2026-07-07)


### Features

* Add Android production build automation workflow ([f34bed8](https://github.com/ihkaru/cerdas/commit/f34bed858f53e3dbe1f3f81b41a87e411226b68c))
* Add Docker production setup and Coolify deployment guide ([a506f8d](https://github.com/ihkaru/cerdas/commit/a506f8d010eabfc782d4eeab66c836d071ac9754))
* add GitHub Actions workflow for automated APK builds and releases ([d3f1527](https://github.com/ihkaru/cerdas/commit/d3f15278980a8e3262a80e0b14ae488b2e12e064))
* add GitHub Actions workflow for automated releases and Android build triggering ([4c14788](https://github.com/ihkaru/cerdas/commit/4c14788fa51bdc4e6baa032864d10f2f548bc530))
* add hybrid dev workflow (local frontend + docker backend) ([4616e04](https://github.com/ihkaru/cerdas/commit/4616e04650315efaec55291d911d0daeb0c1466e))
* add Octane safety audit workflow and script ([fa2915c](https://github.com/ihkaru/cerdas/commit/fa2915c9c6f36fb6b68472147f356f87f7aabf1d))
* Android production build config and guide ([de2d1a4](https://github.com/ihkaru/cerdas/commit/de2d1a4037d46efbed7f1c4b154e6bc48272e6b4))
* **android:** implement dev/prod build variants ([6d130b7](https://github.com/ihkaru/cerdas/commit/6d130b7b831dda9c1d1a11bb3524c0ff9a5e36be))
* automated code quality CI — ESLint (Vue/TS) + Laravel Pint + PHPMD on every push ([278ac4d](https://github.com/ihkaru/cerdas/commit/278ac4d7cc8c09e9a7933ccf8577596505a46f06))
* automated versioning with release-please + commitlint ([a09725c](https://github.com/ihkaru/cerdas/commit/a09725ce1026ab14014b8f425102a7fb33b14035))
* **backend:** add SHA-256 fingerprint to assetlinks.json for Google Login ([530c88d](https://github.com/ihkaru/cerdas/commit/530c88dd421240bd382eb82dbb358a56c222571d))
* **backend:** auto-run migrations on production startup ([a39af5c](https://github.com/ihkaru/cerdas/commit/a39af5c54f871ec6c13e97ceee0a0dc798927755))
* bypass 2000 record limit via cursor pagination for mobile sync ([32279f3](https://github.com/ihkaru/cerdas/commit/32279f38e8859add95a9f33fef0530396afd4fa9))
* **ci:** add audit-deployment script to prevent config errors ([2e02c96](https://github.com/ihkaru/cerdas/commit/2e02c96600a7dcbb99447bfb6c4180013e826f20))
* **ci:** add discord notification support ([12b87c2](https://github.com/ihkaru/cerdas/commit/12b87c21f2380e28349649c6734ad1be46595c5d))
* **ci:** add pre-push build verification hook ([8954cb0](https://github.com/ihkaru/cerdas/commit/8954cb0fb1db45209d660ac98e8d91dcc5d3eb55))
* **ci:** add release link to discord notification ([aac2134](https://github.com/ihkaru/cerdas/commit/aac21340aaad10ac6cb800f4050d7805839b24ac))
* **ci:** automate android build trigger from release-please ([23b5a60](https://github.com/ihkaru/cerdas/commit/23b5a607615898c89e0e766c71387044b5585ef8))
* **ci:** expand audit checks for app_debug, env, and db_host ([add4cfb](https://github.com/ihkaru/cerdas/commit/add4cfb4e06efda2ce9782f7c2211e9ecd374da9))
* **ci:** upgrade pre-push hook to full Android build verification ([12615ac](https://github.com/ihkaru/cerdas/commit/12615ac15018489ee4014b772d280bea6776f4a2))
* **client:** add advanced connection probe and fix ApiClient ([0104819](https://github.com/ihkaru/cerdas/commit/0104819eaac8859d03e0ca1833b29f410cc1004f))
* **client:** comprehensive 4-layer network diagnostics in HealthCheckService ([2a5232b](https://github.com/ihkaru/cerdas/commit/2a5232b7cbb07ea86d1d5553e7edc8d726b1c38f))
* **client:** implement async map rendering engine and simple memory optimizations ([01ed9df](https://github.com/ihkaru/cerdas/commit/01ed9df32694fc4c90349402d06c55d6febfa57d))
* **client:** remove pagination from assignment list ([23505ed](https://github.com/ihkaru/cerdas/commit/23505ed0ed00722c46d0ecc40505ac4667d4094e))
* **client:** update header title to use view name ([2731b92](https://github.com/ihkaru/cerdas/commit/2731b92cd27854b0378c08bc4ab70ca476b21314))
* complete excel import robustness and cleanup backend styles ([7be6944](https://github.com/ihkaru/cerdas/commit/7be69446d1b74ecc4ff25d8a138608af8a1bbf0d))
* complete excel import robustness with batch splitting and job logging ([0cb12b7](https://github.com/ihkaru/cerdas/commit/0cb12b7148ca4f8a99c316c6db6bfc32305c4dfc))
* complete local dev features and docker optimization ([3679883](https://github.com/ihkaru/cerdas/commit/3679883597e3a6d34b8683b49b1168916c079d2b))
* **dev:** dual android dev modes, cors fix, and healthcheck fix ([af4ed4d](https://github.com/ihkaru/cerdas/commit/af4ed4d8ee8282d441e3e58ef76340a4db49de59))
* **docker:** optimize backend with frankenphp static binary and fix port conflicts ([36a6112](https://github.com/ihkaru/cerdas/commit/36a6112d7908bfe4d021eec27b6ff8e9da626e3e))
* **editor:** implement schema reference, copy fallback, and validation for logic editors ([3f216ca](https://github.com/ihkaru/cerdas/commit/3f216ca1536590f9ec017e66a60e713b93be57ac))
* **editor:** improve UX hierarchy and optimize map view ([b5121e0](https://github.com/ihkaru/cerdas/commit/b5121e04265d5db4b2cb3284687bf400700c9472))
* enhanced debug menu with runtime log viewer and auth state ([44b33c0](https://github.com/ihkaru/cerdas/commit/44b33c0fc3378ce57daa22f1d845563e56d957ba))
* Fix invitation logic, shared assignment access, and instant sync ([6feb1f4](https://github.com/ihkaru/cerdas/commit/6feb1f4ef626f3e2f3f8b3bcb78d4c2400dbae43))
* **form-engine/editor:** standardize hint, refactor DateField UI, add read-only toggle ([ed8538c](https://github.com/ihkaru/cerdas/commit/ed8538c9823b3797fd73f80b59f4ee012d9dce1e))
* **form-engine:** add direct google maps directions link to smart detection tip ([c139f52](https://github.com/ihkaru/cerdas/commit/c139f52d3f17fd1e2fd16bdbafc9971f22f057f1))
* implement resizable panels for editor UI (views, actions, fields, data) ([b902607](https://github.com/ihkaru/cerdas/commit/b902607c13b3ab16406d0f925e1a74649f49299e))
* implement scalable async csv export with host-agnostic signed urls, data merging, and infrastructure hardening for 2026 standards (finalized & linted) ([2e5ca4f](https://github.com/ihkaru/cerdas/commit/2e5ca4f638ec2af16253fcc5968457a248fea418))
* implement shareable join links and modernize google auth (April 2026 standards) ([aaa17ec](https://github.com/ihkaru/cerdas/commit/aaa17ec6ce10b5f98902f57af060b38030575840))
* implement user isolation and data purging on account swap ([f22498c](https://github.com/ihkaru/cerdas/commit/f22498c7718b17f3f14e26a900cf3e8734dcdddd))
* Integrate GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID into production build ([bcd5c38](https://github.com/ihkaru/cerdas/commit/bcd5c38da0a5b632df9f1f9bf03d8860aef12425))
* **lint:** add TypeScript anti-pattern rules — eqeqeq, no-explicit-any, no-non-null-assertion ([17b8957](https://github.com/ihkaru/cerdas/commit/17b895758269391d581b0c560e91098fc280edc8))
* migrate backend to Laravel Octane + FrankenPHP worker mode ([92c2e2c](https://github.com/ihkaru/cerdas/commit/92c2e2cf608fd51c8fea29792e37719ebc1e007a))
* monorepo lint cleanup and final push for update system ([8148527](https://github.com/ihkaru/cerdas/commit/8148527947e1ab86560aa4086c065a2eadba09cc))
* optimize map view, add google basemap toggle, and fix pagination ([4818e20](https://github.com/ihkaru/cerdas/commit/4818e2096add1ddd9e2ec30fba3d55ba9ee707df))
* professional README + secret leak detection CI + git history cleanup tool ([70a4f8a](https://github.com/ihkaru/cerdas/commit/70a4f8a0c54987b23637063e6d8f27a710136c4c))
* safe deletion, trash management, and TS strict fixes ([813ca49](https://github.com/ihkaru/cerdas/commit/813ca4956ea07170831632195401314654454624))
* stabilize editor and preview sync ([884475b](https://github.com/ihkaru/cerdas/commit/884475bef72ffc613138063cd219f825c7336374))
* stabilize editor publish flow and enhance live preview sync ([0464ba0](https://github.com/ihkaru/cerdas/commit/0464ba059a50350ae5382d2990119e302050c241))
* **tools:** add script to generate consolidated docker context ([0d9fb9a](https://github.com/ihkaru/cerdas/commit/0d9fb9a5a748a676a014f4806622db7debc7c38a))
* unified versioning, production health check, smart pre-push hook ([2afcd0a](https://github.com/ihkaru/cerdas/commit/2afcd0a2fb4bc773616d168c2ffed2ae86448bbd))
* unify status terms, add dynamic json filters, auto-sync push on complete, and fix layout overlaps ([21adf01](https://github.com/ihkaru/cerdas/commit/21adf01e3627e28e685bd9f2c4ec5eef6a086a13))


### Bug Fixes

* Add coolify network to docker-compose for database connection ([64b84d3](https://github.com/ihkaru/cerdas/commit/64b84d3557ac60ede01315d8d6d35c59caa83a4f))
* Add missing GOOGLE_CLIENT_ID to scheduler service (correction) ([4c34a68](https://github.com/ihkaru/cerdas/commit/4c34a68cdc11f100f3364340de08b69d7890594a))
* add production domains to CORS allowed origins ([c278777](https://github.com/ihkaru/cerdas/commit/c27877750cbeaae88c76a3d0890e4bc47c2465bb))
* add shared storage volume for production uploads ([912414d](https://github.com/ihkaru/cerdas/commit/912414dbb58099ce33d4c468298d313ac82f0542))
* **android:** production build uses static assets, dev scripts enbable live reload ([3221316](https://github.com/ihkaru/cerdas/commit/3221316bd63d0c871501433bc459553baa338198))
* **android:** repair build.gradle syntax ([551798d](https://github.com/ihkaru/cerdas/commit/551798d9ed450ee3c83497d11c989728c929d8ad))
* **android:** robust signing config loading to prevent local build failures ([5b9e658](https://github.com/ihkaru/cerdas/commit/5b9e6584ce8094f985506ae923ad2b76c6df8fb0))
* **auth:** add debug logging to Google Login to diagnose failure ([d669f2d](https://github.com/ihkaru/cerdas/commit/d669f2d88b06dfa24bfaf0051e8ae08b7b1a6ae0))
* Backend Dockerfile extensions and composer flags to fix build ([1ca1d1a](https://github.com/ihkaru/cerdas/commit/1ca1d1ad414463c0cec341744e2a52a7e3fe72aa))
* **backend:** add android origins to cors allow list ([1e55611](https://github.com/ihkaru/cerdas/commit/1e5561117954e3d2aaca45c3dffbd4465369ca2e))
* **backend:** add trim to CORS allowed origins explode logic ([86a2065](https://github.com/ihkaru/cerdas/commit/86a206545119bb07e8f7ef7a6532078b6932545d))
* **backend:** allow CORS on all paths ([69a8507](https://github.com/ihkaru/cerdas/commit/69a8507ebd71fb8e85992de05768b05aa8be1907))
* **backend:** increase upload memory limit and clarify health check timeout ([342acd5](https://github.com/ihkaru/cerdas/commit/342acd53123e3e0c9f7238614bccd3a0547af63a))
* **backend:** prepend HandleCors middleware to prevent intermittent CORS errors ([c47926c](https://github.com/ihkaru/cerdas/commit/c47926c917e07560d3a8bd048008c45c04461a9d))
* **backend:** prevent calling total() on cursor paginator log ([5770e4b](https://github.com/ihkaru/cerdas/commit/5770e4b69e0aab1f996a5da6d3548140cae14e7b))
* **backend:** run package discovery and optimization at runtime in docker entrypoint ([865b4a2](https://github.com/ihkaru/cerdas/commit/865b4a259fe6eeac2b747094b4dd3383840113d1))
* **backend:** skip scripts in composer dump-autoload during docker build ([da6b4ff](https://github.com/ihkaru/cerdas/commit/da6b4ff73bb40ad6ee1186384840d8892543816c))
* **backend:** use environment variable for CORS allowed origins to resolve production connectivity issues ([4a9d18e](https://github.com/ihkaru/cerdas/commit/4a9d18e0899ed461668b1181ad50953e6f542ced))
* **ci:** add cap add android before sync (android/ is gitignored) ([3f20bd7](https://github.com/ihkaru/cerdas/commit/3f20bd7175782e811a941523e8b8534ad8613960))
* **ci:** add contents: write permission for GitHub release ([9bf92ca](https://github.com/ihkaru/cerdas/commit/9bf92caa19e01c9a404b167836360fc51e092f35))
* **ci:** add pnpm caching, fix heredoc quoting, add PR paths filter ([fade3e0](https://github.com/ihkaru/cerdas/commit/fade3e023645e5e463e5b37ddc163c1495c466d7))
* **ci:** bump Java 17-&gt;21 for Capacitor Android source release compatibility ([6c233f8](https://github.com/ihkaru/cerdas/commit/6c233f8fcd724b4b9bd546fa37b303f8f324763a))
* **ci:** bump Node.js from 20 to 22 for Capacitor CLI compatibility ([befb948](https://github.com/ihkaru/cerdas/commit/befb948d668142ea0b412c302ea41562a7bac36a))
* **ci:** declare secrets in workflow_call definition ([fae1104](https://github.com/ihkaru/cerdas/commit/fae1104d89ae99b4a7dcd559668c001e20fa63bd))
* **ci:** disable composer scripts in code quality workflow to prevent env errors ([734526d](https://github.com/ihkaru/cerdas/commit/734526daef0a9c2ead346c64e92c8e16e44cce71))
* **ci:** enable android native build in CI ([c038dd5](https://github.com/ihkaru/cerdas/commit/c038dd563471ab41bf4a7c31e07f0da08ed2cacc))
* **ci:** fail build if signing missing and verify keystore file ([a95952a](https://github.com/ihkaru/cerdas/commit/a95952a0cf668a32b68926cb51ac024fffd30cae))
* **ci:** grant write permissions to release-please ([511e96e](https://github.com/ihkaru/cerdas/commit/511e96e4bf14f03784ff2622c8b200af6916629d))
* **ci:** remove explicit pnpm version to avoid conflict with packageManager ([65c00f2](https://github.com/ihkaru/cerdas/commit/65c00f249a674f5c21e135efc09fa1e27b5f15b0))
* **ci:** remove reserved GITHUB_TOKEN from workflow_call definition ([5d201d8](https://github.com/ihkaru/cerdas/commit/5d201d8d26819fb870c58a3e65b72ddecc085524))
* **ci:** remove unused interfaces and resolve type mismatch ([b736abe](https://github.com/ihkaru/cerdas/commit/b736abef7223bbafd82a4f6ac6dcf50127f487aa))
* **ci:** resolve module resolution issues and discord notification character limits ([1da12e5](https://github.com/ihkaru/cerdas/commit/1da12e56817d05c4d8b14f6a2a7eb93d3b78940b))
* **ci:** restore github token and fix yaml syntax ([8caacfc](https://github.com/ihkaru/cerdas/commit/8caacfc6d468558412ff094a2b8ed6a04d754d96))
* **ci:** restore workflow_dispatch trigger ([127bec2](https://github.com/ihkaru/cerdas/commit/127bec2c29492fd53bfc9a9496c174e69149856d))
* **ci:** show full keytool output to avoid grep exit code failure ([f891c18](https://github.com/ihkaru/cerdas/commit/f891c18fcff87b67db6556f26f025bdc6bb88835))
* **ci:** simplify discord notification to avoid length limit ([637a0b6](https://github.com/ihkaru/cerdas/commit/637a0b6da37747e8138d074ead415effe4fec7bc))
* **ci:** use env var for discord checking ([71a2aaa](https://github.com/ihkaru/cerdas/commit/71a2aaa961e1a6e3beb71e1f5877f242c5922844))
* **client:** correctly parse auth/me payload in verifySession ([b5b98bd](https://github.com/ihkaru/cerdas/commit/b5b98bda2bca2411b5a53ec5a7a633e8c38e092a))
* **client:** enable grouping transition animation across levels ([2dcc456](https://github.com/ihkaru/cerdas/commit/2dcc45601f45c28e9181c06f3ac18ffea2c47f7e))
* **client:** enhance google login error logging and alert ([5079898](https://github.com/ihkaru/cerdas/commit/50798982aeeda7a6eb7434011610c6b9bc4623c1))
* **client:** ensure sync updates correct local table record ([c675019](https://github.com/ihkaru/cerdas/commit/c6750197bc1a6d0bfed3b8eacefe9f6caecdffec))
* **client:** import App type in DashboardRepository ([f08d5b4](https://github.com/ihkaru/cerdas/commit/f08d5b4af3ee90bb52ae8dfc2b08beaa3c3e0858))
* **client:** improve debug menu scrolling on android ([67d1d3a](https://github.com/ihkaru/cerdas/commit/67d1d3a8a1bac292dfa4dd3aed10623632d93dbf))
* **client:** log actual origin for CORS debugging ([b78219d](https://github.com/ihkaru/cerdas/commit/b78219d51bf0c8d05ba4f45ed6809b4945b1cd17))
* **client:** optimize map cluster memory & enable largeHeap for stability ([9785eff](https://github.com/ihkaru/cerdas/commit/9785eff42ce4be371824098b4fbde34d3b4b0add))
* **client:** recreate sqlite schema instantly during local db reset to prevent no such table errors ([186599b](https://github.com/ihkaru/cerdas/commit/186599bff93e692668823c68a4ad94b54fbfc694))
* **client:** remove commented out code in SyncService.ts to satisfy CI linter ([5ad5749](https://github.com/ihkaru/cerdas/commit/5ad5749ec848ecb8c44571592b3292c7886273ae))
* **client:** rename unused variable in AppGallery ([b2a3450](https://github.com/ihkaru/cerdas/commit/b2a3450646c1e58de9d0447c69c855d1e68f1da9))
* **client:** resolve assignment detail empty data race condition and other improvements ([8d829eb](https://github.com/ihkaru/cerdas/commit/8d829ebfdf8e7fc8f8a541379487adb6d94dd80d))
* **client:** resolve lint warnings in AppGallery.vue ([ae5e0d2](https://github.com/ihkaru/cerdas/commit/ae5e0d225495fbbe96fbe48ffba25ec3d0ac7800))
* **client:** resolve SyncService type errors blocking build ([c7d6dbd](https://github.com/ihkaru/cerdas/commit/c7d6dbdf0e02ff43493876edc5fd6d89559958c5))
* **client:** resolve TypeScript error in useAppShellLogic ([3217cd2](https://github.com/ihkaru/cerdas/commit/3217cd239559424ecf0e907e1bf7cc8fb164d988))
* **client:** router syntax error ([d5a32d6](https://github.com/ihkaru/cerdas/commit/d5a32d6aa5ecad5fe397543a2201133cec86eab0))
* **client:** secure join flow against ghost login and double clicks ([31d4fbf](https://github.com/ihkaru/cerdas/commit/31d4fbf1218bffa4c4dddb0733bb64eb481b9ea0))
* convert debug menu to popup for Android scroll + fix CORS for capacitor ([49eb1e5](https://github.com/ihkaru/cerdas/commit/49eb1e59645c4dc2792f4c452613bf6e2584c46a))
* correctly type and disable lint warnings for GpsField ([32c2f52](https://github.com/ihkaru/cerdas/commit/32c2f527d91bae34e24c46c984cdbdf6770f186f))
* critical bug in SyncService orphan cleanup destroying all synced assignments ([61cdc47](https://github.com/ihkaru/cerdas/commit/61cdc4797ca509b41180354851e4703932f39317))
* **dashboard:** resolve assignment filter/sort status counts, z-index, and search bugs ([5188b37](https://github.com/ihkaru/cerdas/commit/5188b37ed871f514cebedfea99657a9bc6ae2b33))
* debug menu rendering on Android - use plain HTML instead of F7 slots ([fc5737a](https://github.com/ihkaru/cerdas/commit/fc5737ace060596dee73183f3ac21f8ee5bf5e3f))
* **docker:** add Composer to FrankenPHP image (exit code 127 = command not found) ([e7e4033](https://github.com/ihkaru/cerdas/commit/e7e40335efc8a2443c9a392f21668c884865ca37))
* **docker:** add missing APP_KEY and APP_URL to worker and scheduler services ([08bc5d8](https://github.com/ihkaru/cerdas/commit/08bc5d8095bad485d80dae003c8a12358872c221))
* **docker:** add missing traefik.docker.network label to fix 504 on editor/client ([2095276](https://github.com/ihkaru/cerdas/commit/209527607bbe79fa29e6827a04470826f935f269))
* **docker:** audit production setup, fix CORS, remove redundancies ([ede4052](https://github.com/ihkaru/cerdas/commit/ede4052f9073569812fab8888c9c574747988223))
* **docker:** change backend expose port from 80 to 8080 to match serversideup image ([f2fad8a](https://github.com/ihkaru/cerdas/commit/f2fad8ae4ca07f995c5105bc0e7a8e63f93b28ba))
* **docker:** enable local dev with database and proper build context ([ae3502f](https://github.com/ihkaru/cerdas/commit/ae3502f12eb119c67d49e267e25003d8056ae11c))
* **docker:** expand .dockerignore to exclude 38MB APK and build artifacts, update COOLIFY_GUIDE ([11c0d00](https://github.com/ihkaru/cerdas/commit/11c0d008449a143d0f9da9ae84fc2e55f99614f9))
* **editor:** add missing marker_style_fn to ViewDefinition type ([a762d40](https://github.com/ihkaru/cerdas/commit/a762d40f171aa4eb71b636cffafe428cbd786e5b))
* **editor:** fix broken relative import paths in store tests ([4aaae56](https://github.com/ihkaru/cerdas/commit/4aaae5668f17854a893de965afab63b2dd1e477c))
* **editor:** Live Preview Reactivity, GroupBy Logic & UX ([6f489c2](https://github.com/ihkaru/cerdas/commit/6f489c2e7a07bc945891609dab8390fff2718aed))
* **editor:** normalize api base url to prevent double path in echo config ([29e0028](https://github.com/ihkaru/cerdas/commit/29e0028facd0d18a1879c8a1045409760cc14181))
* **editor:** satisfy SSOT by adding metadata for new field types ([a466f1c](https://github.com/ihkaru/cerdas/commit/a466f1c2720b70bcd3cb5ede07aa7e0132e24b75))
* enforce anti-cache headers for index.html in nginx.conf ([b4ee206](https://github.com/ihkaru/cerdas/commit/b4ee206c9e0abf03599d92863f0dc4b4b9a1ff87))
* final update system polish with hardened reload and native safety ([3f59698](https://github.com/ihkaru/cerdas/commit/3f5969848cd4fcc1979f37b9236e43f3975ea3b4))
* **form-engine:** fix unknown type error in geoUtils ([b11997e](https://github.com/ihkaru/cerdas/commit/b11997eb45f77f285bac2a2d94179a3f2a707633))
* **form-engine:** remove invalid timePicker24h property from calendar config ([46aa255](https://github.com/ihkaru/cerdas/commit/46aa255bc593c192ae6455fd79f542aef882a10a))
* **form-engine:** resolve build errors in DateField.vue (unused vars and type mismatch) ([5d5187b](https://github.com/ihkaru/cerdas/commit/5d5187bd0bd265fe266af987578d49629bfee288))
* **form-engine:** resolve gps field rendering issues and add smart coordinate detection ([81442af](https://github.com/ihkaru/cerdas/commit/81442af4e99bcd2d9535ae66a1657e0b89c0a642))
* **form-engine:** resolve vue module resolution and type declaration errors ([ed70b52](https://github.com/ihkaru/cerdas/commit/ed70b52510cd82c1f379b461a540927e00028f3d))
* Frontend Dockerfile COPY dist path for monorepo context ([00ddaa4](https://github.com/ihkaru/cerdas/commit/00ddaa454c762132481086f534bab1b9716ca981))
* Frontend Dockerfile COPY nginx.conf path for monorepo context ([beab238](https://github.com/ihkaru/cerdas/commit/beab23826d6d11e9b467e9a40283210049f7f8ea))
* Frontend Dockerfile monorepo build context and pnpm support ([37c9a12](https://github.com/ihkaru/cerdas/commit/37c9a12990ed8ba5361090c67019c3116cae3b16))
* Frontend Dockerfile skip vue-tsc typecheck for production build reliability ([e41cb05](https://github.com/ihkaru/cerdas/commit/e41cb05439b21f267143b1a5b39acc766704df2c))
* implement safety merge for CORS and Sanctum production domains ([e1c3fe5](https://github.com/ihkaru/cerdas/commit/e1c3fe5d95c2622475fdb4482195462bf38ebbbe))
* **lint:** replace == with === using String() coercion for ID comparisons ([da35a04](https://github.com/ihkaru/cerdas/commit/da35a045bf12a3e0010d878bcb45047fbcb53a71))
* **lint:** resolve remaining 20 lint errors and warnings ([be0b8d9](https://github.com/ihkaru/cerdas/commit/be0b8d969d10d60ab6edf858257ed94a2a547c42))
* LivePreview URL client-&gt;app, enable FrankenPHP worker mode with --workers=auto ([184f392](https://github.com/ihkaru/cerdas/commit/184f3928ac73f5e6b5fb05f064470d383e66bc6b))
* markdown formatting ([a73f850](https://github.com/ihkaru/cerdas/commit/a73f85035f0b2c6f368dccd470c457bf3083f4cc))
* monorepo build blockers and expression engine security suppression ([4cb7582](https://github.com/ihkaru/cerdas/commit/4cb75824c95a44e603462992c7ef96aa5c9a1445))
* **prod:** add traefik label to force port 80 to prevent 2019 misrouting ([800358e](https://github.com/ihkaru/cerdas/commit/800358e889c31251a1f13c6561b8197acf5e4792))
* **prod:** chown frankenphp binary to fix permission denied crash ([1b8fb90](https://github.com/ihkaru/cerdas/commit/1b8fb9044e67b611dd3d5b41a86ea65c4dc716ee))
* **prod:** correct frankenphp binary permissions and path ([7f5ca0b](https://github.com/ihkaru/cerdas/commit/7f5ca0b2919469c6c15ba3a4feb9b09aa52beae5))
* **prod:** disable healthcheck for worker/scheduler properly ([07b8edb](https://github.com/ihkaru/cerdas/commit/07b8edbac3860411b7a3e22aace83dc718430ce5))
* **prod:** exclude bootstrap/cache to prevent dev dependency crash ([685734e](https://github.com/ihkaru/cerdas/commit/685734e2ffa74a7a812d4198be80b2a3d3b0a14a))
* **prod:** final tuning - pin frankenphp 1.10, disable auto_https, clean startup ([4f25f06](https://github.com/ihkaru/cerdas/commit/4f25f06755181c0901c61fd82fc946925c0b4f1a))
* **prod:** force 127.0.0.1 for frontend healthchecks to bypass DNS-IPv6 issue ([7f8726f](https://github.com/ihkaru/cerdas/commit/7f8726fc61dc137f4d1b3173e186b45dd334d5d0))
* **prod:** harden config (reverb port, env vars, health conditions, traefik labels) ([b162cc3](https://github.com/ihkaru/cerdas/commit/b162cc3ce8b1b46c0317f442efe3c57ddfcb1968))
* **prod:** improve android debug scrolling and health check, add assetlinks, print sha256 in ci ([77be455](https://github.com/ihkaru/cerdas/commit/77be4559f6224b3b415d8bcb801d286e362d3020))
* **prod:** pin frankenphp, tune healthcheck, disable auto-download ([42cdfa0](https://github.com/ihkaru/cerdas/commit/42cdfa0f18ee4b0810904aab5a5fd71facf0d383))
* **prod:** remove unsupported --frankenphp-binary flag from octane command ([7c9c095](https://github.com/ihkaru/cerdas/commit/7c9c0950f31a8316f5b04d419246ebc6b8eb68dd))
* **prod:** rename Caddyfile to avoid windows path in docker ([93e43bd](https://github.com/ihkaru/cerdas/commit/93e43bd08d11e24d74dc5528959b00e625058761))
* **prod:** set OCTANE_SERVER_NAME=:80 to accept all host headers ([259eaa8](https://github.com/ihkaru/cerdas/commit/259eaa81defb2f8a543c08cdf660aaefc3afbada))
* **prod:** set ownership to 1000:1000 to match coolify user ([38dfcc6](https://github.com/ihkaru/cerdas/commit/38dfcc62fa37bf52c767c9b214c05471450f8942))
* **prod:** switch backend to port 80 to match coolify default ([aed36ee](https://github.com/ihkaru/cerdas/commit/aed36ee901acd1efeac2026e30727ce7dcece699))
* **prod:** sync EVERYTHING to port 8080 (app, traefik, healthcheck) to resolve 502 ([c1d4988](https://github.com/ihkaru/cerdas/commit/c1d4988ea04e31dd8a421be812b8256af0551b05))
* **prod:** tune healthchecks per coolify specs (exclude worker/scheduler) ([df78bbd](https://github.com/ihkaru/cerdas/commit/df78bbd45c3213aa34bc87f9063dfd934d889dc1))
* **prod:** update healthcheck endpoint to /up ([bf6ccee](https://github.com/ihkaru/cerdas/commit/bf6ccee7cc0f31f7516d434ce654142c8ff421c9))
* **prod:** upgrade frankenphp v2, force binary path, tune healthcheck ([f30039c](https://github.com/ihkaru/cerdas/commit/f30039c2da95e90b5b3a091a92b4a01ab279c43e))
* **prod:** use start-container.sh script for robust startup ([5902ffe](https://github.com/ihkaru/cerdas/commit/5902ffe077dba568427aeae20d6f17ccd4ae35e6))
* **queue:** extend worker max-time to 4h to prevent excel imports from crashing mid-execution ([59f4265](https://github.com/ihkaru/cerdas/commit/59f42652c502b8b4d51f0ffc60b8f2d3ca3fe7a4))
* **queue:** harden queue worker auto-restart script ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))
* regenerate pnpm-lock.yaml after turbo removal ([f2cacf8](https://github.com/ihkaru/cerdas/commit/f2cacf86fb7d22ce139cd0e3ba44b301167718a8))
* remove console.log to satisfy linter ([7e8477f](https://github.com/ihkaru/cerdas/commit/7e8477ff9070debce1968aa333d0055aca7be20c))
* remove unused ref import in useTableSelection.ts ([6e1f880](https://github.com/ihkaru/cerdas/commit/6e1f88028e8b60b0100f06192770bc2e0a0cfe59))
* Replace hardcoded API and Client URLs with environment variables to resolve production CORS issues ([34b1638](https://github.com/ihkaru/cerdas/commit/34b1638b5b6246c41488f158e3d1669006180e0c))
* Resolve Broadcast Auth 500/401 errors & Editor Versioning redundant drafts ([2c04279](https://github.com/ihkaru/cerdas/commit/2c042799daafa1c5c557cdbec46c30d5cb1a090c))
* resolve CI build failures (complexity and ignored exceptions) ([05546ab](https://github.com/ihkaru/cerdas/commit/05546ab003ba90d872bc8dd6f57aa8c9f22731fc))
* resolve CI build failures (unused variables and incorrect computed assignments) ([a83c0d1](https://github.com/ihkaru/cerdas/commit/a83c0d102b8b38d348a2c9455aeccbf886945765))
* resolve ESLint errors to pass GitHub Actions Code Quality checks ([97ca47c](https://github.com/ihkaru/cerdas/commit/97ca47c644bc97a20f07535557ea2c5782b0439c))
* resolve final runtime and typescript errors in editor ([50846be](https://github.com/ihkaru/cerdas/commit/50846be980ed74c3940f0bb36871e16909cc8953))
* resolve final sonarjs lint error in SubmissionsPanel for CI/CD pass ([40ffbe1](https://github.com/ihkaru/cerdas/commit/40ffbe1ed291559172aad55a24f874ddc2041b67))
* resolve final type errors in useAppMetadata.ts ([cbcd723](https://github.com/ihkaru/cerdas/commit/cbcd7239d160eb849c1b30a5803a4696a1819909))
* resolve lint errors and add local verify scripts ([64ce003](https://github.com/ihkaru/cerdas/commit/64ce0037661f1df049ac80f4da37e4f80e7803f9))
* resolve map navigation error, fix geoUtils type break, and enhance excel import ([256a6d3](https://github.com/ihkaru/cerdas/commit/256a6d3ca6a611e19cd7f54c4ffba50a137d117a))
* resolve MapView build break ([cb2827d](https://github.com/ihkaru/cerdas/commit/cb2827d88ca44c6b85bc23488346b8ee8420a97f))
* resolve PWA update loop with SKIP_WAITING and fix TypeScript editor compile issues ([be55f5c](https://github.com/ihkaru/cerdas/commit/be55f5cd7852d1e41b7aeaddf44df36236ef52a6))
* resolve remaining vue-tsc errors in useAppMetadata.ts ([aaaec1c](https://github.com/ihkaru/cerdas/commit/aaaec1c8a4c7073f4e0e9b1c37da53e5952d00ff))
* resolve synchronization 404s, editor save 400s, and dynamic join link domain ([ade7fe1](https://github.com/ihkaru/cerdas/commit/ade7fe1cb911a2d9778a1a227f9170dcec4b449a))
* resolve update loop by fixing version detection logic and adding logging ([d0f434d](https://github.com/ihkaru/cerdas/commit/d0f434d92f3d9b92e1c4deea52be4773bd799923))
* resolve vue v-if/v-for conflict and enable pre-commit hooks ([0cab18e](https://github.com/ihkaru/cerdas/commit/0cab18e27566166f7d5b359d3f333c362437c712))
* resolve vue-tsc build errors ([545a799](https://github.com/ihkaru/cerdas/commit/545a799016c2c1e5ead7324793bc1953bc52b4e6))
* stabilize dashboard sync and join flow cleanup ([996e318](https://github.com/ihkaru/cerdas/commit/996e318574974c67895497150c05d3760c8e755e))
* **sync,toggle:** fix infinite toggle loop and client app deletion sync ([018e373](https://github.com/ihkaru/cerdas/commit/018e3733d40660e10feeb9570207258d949c2085))
* **sync:** logic improvements and lint fixes ([1213977](https://github.com/ihkaru/cerdas/commit/121397743ae0601028f74b817fd70a589f5102fb))
* **sync:** resolve lint errors ([f78c3f0](https://github.com/ihkaru/cerdas/commit/f78c3f0e3dc27ea5c36a57c4b9dc21b4e0b25524))
* **sync:** resolve rollback versioning issue and add comprehensive debug logs ([5573a98](https://github.com/ihkaru/cerdas/commit/5573a98e6203273421d3b7fa1adecf9018feee68))
* total stabilization of app join and dashboard ([17d166b](https://github.com/ihkaru/cerdas/commit/17d166b5e6c9d65f25357c8a763d3cb4cfee3400))
* **workflow:** harden discord notification and clean up build artifacts ([faa7d1e](https://github.com/ihkaru/cerdas/commit/faa7d1ef2453f036e3704f14d37b2b0a1c58a3db))


### Performance Improvements

* **backend:** remove logging from auth check ([1606f89](https://github.com/ihkaru/cerdas/commit/1606f89fdb950b38d527cad2be11b7ff75598db3))
* **client:** improve app shell load performance and UX ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))
* **docker:** introduce BuildKit cache mounts for instant NPM/Composer instals ([da24cf8](https://github.com/ihkaru/cerdas/commit/da24cf85f27b6f51224cd8d3a9a9c20333aa5b26))
* **docker:** optimize chown execution for instant builds ([97a2c62](https://github.com/ihkaru/cerdas/commit/97a2c621620957c5f4eabe38dd339c1c39dcd32a))
* enable OPcache, fix healthcheck, optimize Dockerfile for production ([158530f](https://github.com/ihkaru/cerdas/commit/158530fc8c4a3a41609b2d706dba71bd826c03d5))
* **map:** optimize buildGeoJson and add clustering config ([61c8019](https://github.com/ihkaru/cerdas/commit/61c80194d168d90680152492b76731350e6db9c3))
* optimize backend (PHP 8.4, root JSON response) and sync versions ([56dca33](https://github.com/ihkaru/cerdas/commit/56dca33995333100faada82a7ba87a10658658c1))

## [0.1.68](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.67...cerdas-v0.1.68) (2026-07-07)


### Features

* **docker:** optimize backend with frankenphp static binary and fix port conflicts ([36a6112](https://github.com/ihkaru/cerdas/commit/36a6112d7908bfe4d021eec27b6ff8e9da626e3e))
* unify status terms, add dynamic json filters, auto-sync push on complete, and fix layout overlaps ([21adf01](https://github.com/ihkaru/cerdas/commit/21adf01e3627e28e685bd9f2c4ec5eef6a086a13))


### Bug Fixes

* enforce anti-cache headers for index.html in nginx.conf ([b4ee206](https://github.com/ihkaru/cerdas/commit/b4ee206c9e0abf03599d92863f0dc4b4b9a1ff87))
* resolve PWA update loop with SKIP_WAITING and fix TypeScript editor compile issues ([be55f5c](https://github.com/ihkaru/cerdas/commit/be55f5cd7852d1e41b7aeaddf44df36236ef52a6))
* **sync,toggle:** fix infinite toggle loop and client app deletion sync ([018e373](https://github.com/ihkaru/cerdas/commit/018e3733d40660e10feeb9570207258d949c2085))


### Performance Improvements

* optimize backend (PHP 8.4, root JSON response) and sync versions ([56dca33](https://github.com/ihkaru/cerdas/commit/56dca33995333100faada82a7ba87a10658658c1))

## [0.1.67](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.66...cerdas-v0.1.67) (2026-04-17)


### Bug Fixes

* final update system polish with hardened reload and native safety ([3f59698](https://github.com/ihkaru/cerdas/commit/3f5969848cd4fcc1979f37b9236e43f3975ea3b4))
* resolve update loop by fixing version detection logic and adding logging ([d0f434d](https://github.com/ihkaru/cerdas/commit/d0f434d92f3d9b92e1c4deea52be4773bd799923))

## [0.1.66](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.65...cerdas-v0.1.66) (2026-04-17)


### Bug Fixes

* monorepo build blockers and expression engine security suppression ([4cb7582](https://github.com/ihkaru/cerdas/commit/4cb75824c95a44e603462992c7ef96aa5c9a1445))

## [0.1.65](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.64...cerdas-v0.1.65) (2026-04-17)


### Features

* monorepo lint cleanup and final push for update system ([8148527](https://github.com/ihkaru/cerdas/commit/8148527947e1ab86560aa4086c065a2eadba09cc))

## [0.1.64](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.63...cerdas-v0.1.64) (2026-04-16)


### Features

* implement scalable async csv export with host-agnostic signed urls, data merging, and infrastructure hardening for 2026 standards (finalized & linted) ([2e5ca4f](https://github.com/ihkaru/cerdas/commit/2e5ca4f638ec2af16253fcc5968457a248fea418))


### Bug Fixes

* resolve final sonarjs lint error in SubmissionsPanel for CI/CD pass ([40ffbe1](https://github.com/ihkaru/cerdas/commit/40ffbe1ed291559172aad55a24f874ddc2041b67))

## [0.1.63](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.62...cerdas-v0.1.63) (2026-04-15)


### Bug Fixes

* **client:** correctly parse auth/me payload in verifySession ([b5b98bd](https://github.com/ihkaru/cerdas/commit/b5b98bda2bca2411b5a53ec5a7a633e8c38e092a))

## [0.1.62](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.61...cerdas-v0.1.62) (2026-04-15)


### Bug Fixes

* **client:** router syntax error ([d5a32d6](https://github.com/ihkaru/cerdas/commit/d5a32d6aa5ecad5fe397543a2201133cec86eab0))

## [0.1.61](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.60...cerdas-v0.1.61) (2026-04-15)


### Bug Fixes

* **client:** secure join flow against ghost login and double clicks ([31d4fbf](https://github.com/ihkaru/cerdas/commit/31d4fbf1218bffa4c4dddb0733bb64eb481b9ea0))

## [0.1.60](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.59...cerdas-v0.1.60) (2026-04-15)


### Bug Fixes

* **docker:** add missing traefik.docker.network label to fix 504 on editor/client ([2095276](https://github.com/ihkaru/cerdas/commit/209527607bbe79fa29e6827a04470826f935f269))
* **docker:** expand .dockerignore to exclude 38MB APK and build artifacts, update COOLIFY_GUIDE ([11c0d00](https://github.com/ihkaru/cerdas/commit/11c0d008449a143d0f9da9ae84fc2e55f99614f9))

## [0.1.59](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.58...cerdas-v0.1.59) (2026-04-15)


### Bug Fixes

* **form-engine:** remove invalid timePicker24h property from calendar config ([46aa255](https://github.com/ihkaru/cerdas/commit/46aa255bc593c192ae6455fd79f542aef882a10a))
* **form-engine:** resolve build errors in DateField.vue (unused vars and type mismatch) ([5d5187b](https://github.com/ihkaru/cerdas/commit/5d5187bd0bd265fe266af987578d49629bfee288))

## [0.1.58](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.57...cerdas-v0.1.58) (2026-04-15)


### Features

* **form-engine/editor:** standardize hint, refactor DateField UI, add read-only toggle ([ed8538c](https://github.com/ihkaru/cerdas/commit/ed8538c9823b3797fd73f80b59f4ee012d9dce1e))
* implement user isolation and data purging on account swap ([f22498c](https://github.com/ihkaru/cerdas/commit/f22498c7718b17f3f14e26a900cf3e8734dcdddd))
* stabilize editor publish flow and enhance live preview sync ([0464ba0](https://github.com/ihkaru/cerdas/commit/0464ba059a50350ae5382d2990119e302050c241))

## [0.1.57](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.56...cerdas-v0.1.57) (2026-04-15)


### Features

* Add Android production build automation workflow ([f34bed8](https://github.com/ihkaru/cerdas/commit/f34bed858f53e3dbe1f3f81b41a87e411226b68c))
* Add Docker production setup and Coolify deployment guide ([a506f8d](https://github.com/ihkaru/cerdas/commit/a506f8d010eabfc782d4eeab66c836d071ac9754))
* add GitHub Actions workflow for automated APK builds and releases ([d3f1527](https://github.com/ihkaru/cerdas/commit/d3f15278980a8e3262a80e0b14ae488b2e12e064))
* add GitHub Actions workflow for automated releases and Android build triggering ([4c14788](https://github.com/ihkaru/cerdas/commit/4c14788fa51bdc4e6baa032864d10f2f548bc530))
* add hybrid dev workflow (local frontend + docker backend) ([4616e04](https://github.com/ihkaru/cerdas/commit/4616e04650315efaec55291d911d0daeb0c1466e))
* add Octane safety audit workflow and script ([fa2915c](https://github.com/ihkaru/cerdas/commit/fa2915c9c6f36fb6b68472147f356f87f7aabf1d))
* Android production build config and guide ([de2d1a4](https://github.com/ihkaru/cerdas/commit/de2d1a4037d46efbed7f1c4b154e6bc48272e6b4))
* **android:** implement dev/prod build variants ([6d130b7](https://github.com/ihkaru/cerdas/commit/6d130b7b831dda9c1d1a11bb3524c0ff9a5e36be))
* automated code quality CI — ESLint (Vue/TS) + Laravel Pint + PHPMD on every push ([278ac4d](https://github.com/ihkaru/cerdas/commit/278ac4d7cc8c09e9a7933ccf8577596505a46f06))
* automated versioning with release-please + commitlint ([a09725c](https://github.com/ihkaru/cerdas/commit/a09725ce1026ab14014b8f425102a7fb33b14035))
* **backend:** add SHA-256 fingerprint to assetlinks.json for Google Login ([530c88d](https://github.com/ihkaru/cerdas/commit/530c88dd421240bd382eb82dbb358a56c222571d))
* **backend:** auto-run migrations on production startup ([a39af5c](https://github.com/ihkaru/cerdas/commit/a39af5c54f871ec6c13e97ceee0a0dc798927755))
* bypass 2000 record limit via cursor pagination for mobile sync ([32279f3](https://github.com/ihkaru/cerdas/commit/32279f38e8859add95a9f33fef0530396afd4fa9))
* **ci:** add audit-deployment script to prevent config errors ([2e02c96](https://github.com/ihkaru/cerdas/commit/2e02c96600a7dcbb99447bfb6c4180013e826f20))
* **ci:** add discord notification support ([12b87c2](https://github.com/ihkaru/cerdas/commit/12b87c21f2380e28349649c6734ad1be46595c5d))
* **ci:** add pre-push build verification hook ([8954cb0](https://github.com/ihkaru/cerdas/commit/8954cb0fb1db45209d660ac98e8d91dcc5d3eb55))
* **ci:** add release link to discord notification ([aac2134](https://github.com/ihkaru/cerdas/commit/aac21340aaad10ac6cb800f4050d7805839b24ac))
* **ci:** automate android build trigger from release-please ([23b5a60](https://github.com/ihkaru/cerdas/commit/23b5a607615898c89e0e766c71387044b5585ef8))
* **ci:** expand audit checks for app_debug, env, and db_host ([add4cfb](https://github.com/ihkaru/cerdas/commit/add4cfb4e06efda2ce9782f7c2211e9ecd374da9))
* **ci:** upgrade pre-push hook to full Android build verification ([12615ac](https://github.com/ihkaru/cerdas/commit/12615ac15018489ee4014b772d280bea6776f4a2))
* **client:** add advanced connection probe and fix ApiClient ([0104819](https://github.com/ihkaru/cerdas/commit/0104819eaac8859d03e0ca1833b29f410cc1004f))
* **client:** comprehensive 4-layer network diagnostics in HealthCheckService ([2a5232b](https://github.com/ihkaru/cerdas/commit/2a5232b7cbb07ea86d1d5553e7edc8d726b1c38f))
* **client:** implement async map rendering engine and simple memory optimizations ([01ed9df](https://github.com/ihkaru/cerdas/commit/01ed9df32694fc4c90349402d06c55d6febfa57d))
* **client:** remove pagination from assignment list ([23505ed](https://github.com/ihkaru/cerdas/commit/23505ed0ed00722c46d0ecc40505ac4667d4094e))
* **client:** update header title to use view name ([2731b92](https://github.com/ihkaru/cerdas/commit/2731b92cd27854b0378c08bc4ab70ca476b21314))
* complete excel import robustness and cleanup backend styles ([7be6944](https://github.com/ihkaru/cerdas/commit/7be69446d1b74ecc4ff25d8a138608af8a1bbf0d))
* complete excel import robustness with batch splitting and job logging ([0cb12b7](https://github.com/ihkaru/cerdas/commit/0cb12b7148ca4f8a99c316c6db6bfc32305c4dfc))
* complete local dev features and docker optimization ([3679883](https://github.com/ihkaru/cerdas/commit/3679883597e3a6d34b8683b49b1168916c079d2b))
* **dev:** dual android dev modes, cors fix, and healthcheck fix ([af4ed4d](https://github.com/ihkaru/cerdas/commit/af4ed4d8ee8282d441e3e58ef76340a4db49de59))
* **editor:** implement schema reference, copy fallback, and validation for logic editors ([3f216ca](https://github.com/ihkaru/cerdas/commit/3f216ca1536590f9ec017e66a60e713b93be57ac))
* **editor:** improve UX hierarchy and optimize map view ([b5121e0](https://github.com/ihkaru/cerdas/commit/b5121e04265d5db4b2cb3284687bf400700c9472))
* enhanced debug menu with runtime log viewer and auth state ([44b33c0](https://github.com/ihkaru/cerdas/commit/44b33c0fc3378ce57daa22f1d845563e56d957ba))
* Fix invitation logic, shared assignment access, and instant sync ([6feb1f4](https://github.com/ihkaru/cerdas/commit/6feb1f4ef626f3e2f3f8b3bcb78d4c2400dbae43))
* **form-engine:** add direct google maps directions link to smart detection tip ([c139f52](https://github.com/ihkaru/cerdas/commit/c139f52d3f17fd1e2fd16bdbafc9971f22f057f1))
* implement resizable panels for editor UI (views, actions, fields, data) ([b902607](https://github.com/ihkaru/cerdas/commit/b902607c13b3ab16406d0f925e1a74649f49299e))
* implement shareable join links and modernize google auth (April 2026 standards) ([aaa17ec](https://github.com/ihkaru/cerdas/commit/aaa17ec6ce10b5f98902f57af060b38030575840))
* Integrate GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID into production build ([bcd5c38](https://github.com/ihkaru/cerdas/commit/bcd5c38da0a5b632df9f1f9bf03d8860aef12425))
* **lint:** add TypeScript anti-pattern rules — eqeqeq, no-explicit-any, no-non-null-assertion ([17b8957](https://github.com/ihkaru/cerdas/commit/17b895758269391d581b0c560e91098fc280edc8))
* migrate backend to Laravel Octane + FrankenPHP worker mode ([92c2e2c](https://github.com/ihkaru/cerdas/commit/92c2e2cf608fd51c8fea29792e37719ebc1e007a))
* optimize map view, add google basemap toggle, and fix pagination ([4818e20](https://github.com/ihkaru/cerdas/commit/4818e2096add1ddd9e2ec30fba3d55ba9ee707df))
* professional README + secret leak detection CI + git history cleanup tool ([70a4f8a](https://github.com/ihkaru/cerdas/commit/70a4f8a0c54987b23637063e6d8f27a710136c4c))
* safe deletion, trash management, and TS strict fixes ([813ca49](https://github.com/ihkaru/cerdas/commit/813ca4956ea07170831632195401314654454624))
* stabilize editor and preview sync ([884475b](https://github.com/ihkaru/cerdas/commit/884475bef72ffc613138063cd219f825c7336374))
* **tools:** add script to generate consolidated docker context ([0d9fb9a](https://github.com/ihkaru/cerdas/commit/0d9fb9a5a748a676a014f4806622db7debc7c38a))
* unified versioning, production health check, smart pre-push hook ([2afcd0a](https://github.com/ihkaru/cerdas/commit/2afcd0a2fb4bc773616d168c2ffed2ae86448bbd))


### Bug Fixes

* Add coolify network to docker-compose for database connection ([64b84d3](https://github.com/ihkaru/cerdas/commit/64b84d3557ac60ede01315d8d6d35c59caa83a4f))
* Add missing GOOGLE_CLIENT_ID to scheduler service (correction) ([4c34a68](https://github.com/ihkaru/cerdas/commit/4c34a68cdc11f100f3364340de08b69d7890594a))
* add production domains to CORS allowed origins ([c278777](https://github.com/ihkaru/cerdas/commit/c27877750cbeaae88c76a3d0890e4bc47c2465bb))
* add shared storage volume for production uploads ([912414d](https://github.com/ihkaru/cerdas/commit/912414dbb58099ce33d4c468298d313ac82f0542))
* **android:** production build uses static assets, dev scripts enbable live reload ([3221316](https://github.com/ihkaru/cerdas/commit/3221316bd63d0c871501433bc459553baa338198))
* **android:** repair build.gradle syntax ([551798d](https://github.com/ihkaru/cerdas/commit/551798d9ed450ee3c83497d11c989728c929d8ad))
* **android:** robust signing config loading to prevent local build failures ([5b9e658](https://github.com/ihkaru/cerdas/commit/5b9e6584ce8094f985506ae923ad2b76c6df8fb0))
* **auth:** add debug logging to Google Login to diagnose failure ([d669f2d](https://github.com/ihkaru/cerdas/commit/d669f2d88b06dfa24bfaf0051e8ae08b7b1a6ae0))
* Backend Dockerfile extensions and composer flags to fix build ([1ca1d1a](https://github.com/ihkaru/cerdas/commit/1ca1d1ad414463c0cec341744e2a52a7e3fe72aa))
* **backend:** add android origins to cors allow list ([1e55611](https://github.com/ihkaru/cerdas/commit/1e5561117954e3d2aaca45c3dffbd4465369ca2e))
* **backend:** add trim to CORS allowed origins explode logic ([86a2065](https://github.com/ihkaru/cerdas/commit/86a206545119bb07e8f7ef7a6532078b6932545d))
* **backend:** allow CORS on all paths ([69a8507](https://github.com/ihkaru/cerdas/commit/69a8507ebd71fb8e85992de05768b05aa8be1907))
* **backend:** increase upload memory limit and clarify health check timeout ([342acd5](https://github.com/ihkaru/cerdas/commit/342acd53123e3e0c9f7238614bccd3a0547af63a))
* **backend:** prepend HandleCors middleware to prevent intermittent CORS errors ([c47926c](https://github.com/ihkaru/cerdas/commit/c47926c917e07560d3a8bd048008c45c04461a9d))
* **backend:** prevent calling total() on cursor paginator log ([5770e4b](https://github.com/ihkaru/cerdas/commit/5770e4b69e0aab1f996a5da6d3548140cae14e7b))
* **backend:** run package discovery and optimization at runtime in docker entrypoint ([865b4a2](https://github.com/ihkaru/cerdas/commit/865b4a259fe6eeac2b747094b4dd3383840113d1))
* **backend:** skip scripts in composer dump-autoload during docker build ([da6b4ff](https://github.com/ihkaru/cerdas/commit/da6b4ff73bb40ad6ee1186384840d8892543816c))
* **backend:** use environment variable for CORS allowed origins to resolve production connectivity issues ([4a9d18e](https://github.com/ihkaru/cerdas/commit/4a9d18e0899ed461668b1181ad50953e6f542ced))
* **ci:** add cap add android before sync (android/ is gitignored) ([3f20bd7](https://github.com/ihkaru/cerdas/commit/3f20bd7175782e811a941523e8b8534ad8613960))
* **ci:** add contents: write permission for GitHub release ([9bf92ca](https://github.com/ihkaru/cerdas/commit/9bf92caa19e01c9a404b167836360fc51e092f35))
* **ci:** add pnpm caching, fix heredoc quoting, add PR paths filter ([fade3e0](https://github.com/ihkaru/cerdas/commit/fade3e023645e5e463e5b37ddc163c1495c466d7))
* **ci:** bump Java 17-&gt;21 for Capacitor Android source release compatibility ([6c233f8](https://github.com/ihkaru/cerdas/commit/6c233f8fcd724b4b9bd546fa37b303f8f324763a))
* **ci:** bump Node.js from 20 to 22 for Capacitor CLI compatibility ([befb948](https://github.com/ihkaru/cerdas/commit/befb948d668142ea0b412c302ea41562a7bac36a))
* **ci:** declare secrets in workflow_call definition ([fae1104](https://github.com/ihkaru/cerdas/commit/fae1104d89ae99b4a7dcd559668c001e20fa63bd))
* **ci:** disable composer scripts in code quality workflow to prevent env errors ([734526d](https://github.com/ihkaru/cerdas/commit/734526daef0a9c2ead346c64e92c8e16e44cce71))
* **ci:** enable android native build in CI ([c038dd5](https://github.com/ihkaru/cerdas/commit/c038dd563471ab41bf4a7c31e07f0da08ed2cacc))
* **ci:** fail build if signing missing and verify keystore file ([a95952a](https://github.com/ihkaru/cerdas/commit/a95952a0cf668a32b68926cb51ac024fffd30cae))
* **ci:** grant write permissions to release-please ([511e96e](https://github.com/ihkaru/cerdas/commit/511e96e4bf14f03784ff2622c8b200af6916629d))
* **ci:** remove explicit pnpm version to avoid conflict with packageManager ([65c00f2](https://github.com/ihkaru/cerdas/commit/65c00f249a674f5c21e135efc09fa1e27b5f15b0))
* **ci:** remove reserved GITHUB_TOKEN from workflow_call definition ([5d201d8](https://github.com/ihkaru/cerdas/commit/5d201d8d26819fb870c58a3e65b72ddecc085524))
* **ci:** remove unused interfaces and resolve type mismatch ([b736abe](https://github.com/ihkaru/cerdas/commit/b736abef7223bbafd82a4f6ac6dcf50127f487aa))
* **ci:** resolve module resolution issues and discord notification character limits ([1da12e5](https://github.com/ihkaru/cerdas/commit/1da12e56817d05c4d8b14f6a2a7eb93d3b78940b))
* **ci:** restore github token and fix yaml syntax ([8caacfc](https://github.com/ihkaru/cerdas/commit/8caacfc6d468558412ff094a2b8ed6a04d754d96))
* **ci:** restore workflow_dispatch trigger ([127bec2](https://github.com/ihkaru/cerdas/commit/127bec2c29492fd53bfc9a9496c174e69149856d))
* **ci:** show full keytool output to avoid grep exit code failure ([f891c18](https://github.com/ihkaru/cerdas/commit/f891c18fcff87b67db6556f26f025bdc6bb88835))
* **ci:** simplify discord notification to avoid length limit ([637a0b6](https://github.com/ihkaru/cerdas/commit/637a0b6da37747e8138d074ead415effe4fec7bc))
* **ci:** use env var for discord checking ([71a2aaa](https://github.com/ihkaru/cerdas/commit/71a2aaa961e1a6e3beb71e1f5877f242c5922844))
* **client:** enable grouping transition animation across levels ([2dcc456](https://github.com/ihkaru/cerdas/commit/2dcc45601f45c28e9181c06f3ac18ffea2c47f7e))
* **client:** enhance google login error logging and alert ([5079898](https://github.com/ihkaru/cerdas/commit/50798982aeeda7a6eb7434011610c6b9bc4623c1))
* **client:** ensure sync updates correct local table record ([c675019](https://github.com/ihkaru/cerdas/commit/c6750197bc1a6d0bfed3b8eacefe9f6caecdffec))
* **client:** import App type in DashboardRepository ([f08d5b4](https://github.com/ihkaru/cerdas/commit/f08d5b4af3ee90bb52ae8dfc2b08beaa3c3e0858))
* **client:** improve debug menu scrolling on android ([67d1d3a](https://github.com/ihkaru/cerdas/commit/67d1d3a8a1bac292dfa4dd3aed10623632d93dbf))
* **client:** log actual origin for CORS debugging ([b78219d](https://github.com/ihkaru/cerdas/commit/b78219d51bf0c8d05ba4f45ed6809b4945b1cd17))
* **client:** optimize map cluster memory & enable largeHeap for stability ([9785eff](https://github.com/ihkaru/cerdas/commit/9785eff42ce4be371824098b4fbde34d3b4b0add))
* **client:** recreate sqlite schema instantly during local db reset to prevent no such table errors ([186599b](https://github.com/ihkaru/cerdas/commit/186599bff93e692668823c68a4ad94b54fbfc694))
* **client:** remove commented out code in SyncService.ts to satisfy CI linter ([5ad5749](https://github.com/ihkaru/cerdas/commit/5ad5749ec848ecb8c44571592b3292c7886273ae))
* **client:** rename unused variable in AppGallery ([b2a3450](https://github.com/ihkaru/cerdas/commit/b2a3450646c1e58de9d0447c69c855d1e68f1da9))
* **client:** resolve assignment detail empty data race condition and other improvements ([8d829eb](https://github.com/ihkaru/cerdas/commit/8d829ebfdf8e7fc8f8a541379487adb6d94dd80d))
* **client:** resolve lint warnings in AppGallery.vue ([ae5e0d2](https://github.com/ihkaru/cerdas/commit/ae5e0d225495fbbe96fbe48ffba25ec3d0ac7800))
* **client:** resolve SyncService type errors blocking build ([c7d6dbd](https://github.com/ihkaru/cerdas/commit/c7d6dbdf0e02ff43493876edc5fd6d89559958c5))
* **client:** resolve TypeScript error in useAppShellLogic ([3217cd2](https://github.com/ihkaru/cerdas/commit/3217cd239559424ecf0e907e1bf7cc8fb164d988))
* convert debug menu to popup for Android scroll + fix CORS for capacitor ([49eb1e5](https://github.com/ihkaru/cerdas/commit/49eb1e59645c4dc2792f4c452613bf6e2584c46a))
* correctly type and disable lint warnings for GpsField ([32c2f52](https://github.com/ihkaru/cerdas/commit/32c2f527d91bae34e24c46c984cdbdf6770f186f))
* critical bug in SyncService orphan cleanup destroying all synced assignments ([61cdc47](https://github.com/ihkaru/cerdas/commit/61cdc4797ca509b41180354851e4703932f39317))
* **dashboard:** resolve assignment filter/sort status counts, z-index, and search bugs ([5188b37](https://github.com/ihkaru/cerdas/commit/5188b37ed871f514cebedfea99657a9bc6ae2b33))
* debug menu rendering on Android - use plain HTML instead of F7 slots ([fc5737a](https://github.com/ihkaru/cerdas/commit/fc5737ace060596dee73183f3ac21f8ee5bf5e3f))
* **docker:** add Composer to FrankenPHP image (exit code 127 = command not found) ([e7e4033](https://github.com/ihkaru/cerdas/commit/e7e40335efc8a2443c9a392f21668c884865ca37))
* **docker:** add missing APP_KEY and APP_URL to worker and scheduler services ([08bc5d8](https://github.com/ihkaru/cerdas/commit/08bc5d8095bad485d80dae003c8a12358872c221))
* **docker:** audit production setup, fix CORS, remove redundancies ([ede4052](https://github.com/ihkaru/cerdas/commit/ede4052f9073569812fab8888c9c574747988223))
* **docker:** change backend expose port from 80 to 8080 to match serversideup image ([f2fad8a](https://github.com/ihkaru/cerdas/commit/f2fad8ae4ca07f995c5105bc0e7a8e63f93b28ba))
* **docker:** enable local dev with database and proper build context ([ae3502f](https://github.com/ihkaru/cerdas/commit/ae3502f12eb119c67d49e267e25003d8056ae11c))
* **editor:** add missing marker_style_fn to ViewDefinition type ([a762d40](https://github.com/ihkaru/cerdas/commit/a762d40f171aa4eb71b636cffafe428cbd786e5b))
* **editor:** fix broken relative import paths in store tests ([4aaae56](https://github.com/ihkaru/cerdas/commit/4aaae5668f17854a893de965afab63b2dd1e477c))
* **editor:** Live Preview Reactivity, GroupBy Logic & UX ([6f489c2](https://github.com/ihkaru/cerdas/commit/6f489c2e7a07bc945891609dab8390fff2718aed))
* **editor:** normalize api base url to prevent double path in echo config ([29e0028](https://github.com/ihkaru/cerdas/commit/29e0028facd0d18a1879c8a1045409760cc14181))
* **editor:** satisfy SSOT by adding metadata for new field types ([a466f1c](https://github.com/ihkaru/cerdas/commit/a466f1c2720b70bcd3cb5ede07aa7e0132e24b75))
* **form-engine:** fix unknown type error in geoUtils ([b11997e](https://github.com/ihkaru/cerdas/commit/b11997eb45f77f285bac2a2d94179a3f2a707633))
* **form-engine:** resolve gps field rendering issues and add smart coordinate detection ([81442af](https://github.com/ihkaru/cerdas/commit/81442af4e99bcd2d9535ae66a1657e0b89c0a642))
* **form-engine:** resolve vue module resolution and type declaration errors ([ed70b52](https://github.com/ihkaru/cerdas/commit/ed70b52510cd82c1f379b461a540927e00028f3d))
* Frontend Dockerfile COPY dist path for monorepo context ([00ddaa4](https://github.com/ihkaru/cerdas/commit/00ddaa454c762132481086f534bab1b9716ca981))
* Frontend Dockerfile COPY nginx.conf path for monorepo context ([beab238](https://github.com/ihkaru/cerdas/commit/beab23826d6d11e9b467e9a40283210049f7f8ea))
* Frontend Dockerfile monorepo build context and pnpm support ([37c9a12](https://github.com/ihkaru/cerdas/commit/37c9a12990ed8ba5361090c67019c3116cae3b16))
* Frontend Dockerfile skip vue-tsc typecheck for production build reliability ([e41cb05](https://github.com/ihkaru/cerdas/commit/e41cb05439b21f267143b1a5b39acc766704df2c))
* implement safety merge for CORS and Sanctum production domains ([e1c3fe5](https://github.com/ihkaru/cerdas/commit/e1c3fe5d95c2622475fdb4482195462bf38ebbbe))
* **lint:** replace == with === using String() coercion for ID comparisons ([da35a04](https://github.com/ihkaru/cerdas/commit/da35a045bf12a3e0010d878bcb45047fbcb53a71))
* **lint:** resolve remaining 20 lint errors and warnings ([be0b8d9](https://github.com/ihkaru/cerdas/commit/be0b8d969d10d60ab6edf858257ed94a2a547c42))
* LivePreview URL client-&gt;app, enable FrankenPHP worker mode with --workers=auto ([184f392](https://github.com/ihkaru/cerdas/commit/184f3928ac73f5e6b5fb05f064470d383e66bc6b))
* markdown formatting ([a73f850](https://github.com/ihkaru/cerdas/commit/a73f85035f0b2c6f368dccd470c457bf3083f4cc))
* **prod:** add traefik label to force port 80 to prevent 2019 misrouting ([800358e](https://github.com/ihkaru/cerdas/commit/800358e889c31251a1f13c6561b8197acf5e4792))
* **prod:** chown frankenphp binary to fix permission denied crash ([1b8fb90](https://github.com/ihkaru/cerdas/commit/1b8fb9044e67b611dd3d5b41a86ea65c4dc716ee))
* **prod:** correct frankenphp binary permissions and path ([7f5ca0b](https://github.com/ihkaru/cerdas/commit/7f5ca0b2919469c6c15ba3a4feb9b09aa52beae5))
* **prod:** disable healthcheck for worker/scheduler properly ([07b8edb](https://github.com/ihkaru/cerdas/commit/07b8edbac3860411b7a3e22aace83dc718430ce5))
* **prod:** exclude bootstrap/cache to prevent dev dependency crash ([685734e](https://github.com/ihkaru/cerdas/commit/685734e2ffa74a7a812d4198be80b2a3d3b0a14a))
* **prod:** final tuning - pin frankenphp 1.10, disable auto_https, clean startup ([4f25f06](https://github.com/ihkaru/cerdas/commit/4f25f06755181c0901c61fd82fc946925c0b4f1a))
* **prod:** force 127.0.0.1 for frontend healthchecks to bypass DNS-IPv6 issue ([7f8726f](https://github.com/ihkaru/cerdas/commit/7f8726fc61dc137f4d1b3173e186b45dd334d5d0))
* **prod:** harden config (reverb port, env vars, health conditions, traefik labels) ([b162cc3](https://github.com/ihkaru/cerdas/commit/b162cc3ce8b1b46c0317f442efe3c57ddfcb1968))
* **prod:** improve android debug scrolling and health check, add assetlinks, print sha256 in ci ([77be455](https://github.com/ihkaru/cerdas/commit/77be4559f6224b3b415d8bcb801d286e362d3020))
* **prod:** pin frankenphp, tune healthcheck, disable auto-download ([42cdfa0](https://github.com/ihkaru/cerdas/commit/42cdfa0f18ee4b0810904aab5a5fd71facf0d383))
* **prod:** remove unsupported --frankenphp-binary flag from octane command ([7c9c095](https://github.com/ihkaru/cerdas/commit/7c9c0950f31a8316f5b04d419246ebc6b8eb68dd))
* **prod:** rename Caddyfile to avoid windows path in docker ([93e43bd](https://github.com/ihkaru/cerdas/commit/93e43bd08d11e24d74dc5528959b00e625058761))
* **prod:** set OCTANE_SERVER_NAME=:80 to accept all host headers ([259eaa8](https://github.com/ihkaru/cerdas/commit/259eaa81defb2f8a543c08cdf660aaefc3afbada))
* **prod:** set ownership to 1000:1000 to match coolify user ([38dfcc6](https://github.com/ihkaru/cerdas/commit/38dfcc62fa37bf52c767c9b214c05471450f8942))
* **prod:** switch backend to port 80 to match coolify default ([aed36ee](https://github.com/ihkaru/cerdas/commit/aed36ee901acd1efeac2026e30727ce7dcece699))
* **prod:** sync EVERYTHING to port 8080 (app, traefik, healthcheck) to resolve 502 ([c1d4988](https://github.com/ihkaru/cerdas/commit/c1d4988ea04e31dd8a421be812b8256af0551b05))
* **prod:** tune healthchecks per coolify specs (exclude worker/scheduler) ([df78bbd](https://github.com/ihkaru/cerdas/commit/df78bbd45c3213aa34bc87f9063dfd934d889dc1))
* **prod:** update healthcheck endpoint to /up ([bf6ccee](https://github.com/ihkaru/cerdas/commit/bf6ccee7cc0f31f7516d434ce654142c8ff421c9))
* **prod:** upgrade frankenphp v2, force binary path, tune healthcheck ([f30039c](https://github.com/ihkaru/cerdas/commit/f30039c2da95e90b5b3a091a92b4a01ab279c43e))
* **prod:** use start-container.sh script for robust startup ([5902ffe](https://github.com/ihkaru/cerdas/commit/5902ffe077dba568427aeae20d6f17ccd4ae35e6))
* **queue:** extend worker max-time to 4h to prevent excel imports from crashing mid-execution ([59f4265](https://github.com/ihkaru/cerdas/commit/59f42652c502b8b4d51f0ffc60b8f2d3ca3fe7a4))
* **queue:** harden queue worker auto-restart script ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))
* regenerate pnpm-lock.yaml after turbo removal ([f2cacf8](https://github.com/ihkaru/cerdas/commit/f2cacf86fb7d22ce139cd0e3ba44b301167718a8))
* remove console.log to satisfy linter ([7e8477f](https://github.com/ihkaru/cerdas/commit/7e8477ff9070debce1968aa333d0055aca7be20c))
* remove unused ref import in useTableSelection.ts ([6e1f880](https://github.com/ihkaru/cerdas/commit/6e1f88028e8b60b0100f06192770bc2e0a0cfe59))
* Replace hardcoded API and Client URLs with environment variables to resolve production CORS issues ([34b1638](https://github.com/ihkaru/cerdas/commit/34b1638b5b6246c41488f158e3d1669006180e0c))
* Resolve Broadcast Auth 500/401 errors & Editor Versioning redundant drafts ([2c04279](https://github.com/ihkaru/cerdas/commit/2c042799daafa1c5c557cdbec46c30d5cb1a090c))
* resolve CI build failures (complexity and ignored exceptions) ([05546ab](https://github.com/ihkaru/cerdas/commit/05546ab003ba90d872bc8dd6f57aa8c9f22731fc))
* resolve CI build failures (unused variables and incorrect computed assignments) ([a83c0d1](https://github.com/ihkaru/cerdas/commit/a83c0d102b8b38d348a2c9455aeccbf886945765))
* resolve final runtime and typescript errors in editor ([50846be](https://github.com/ihkaru/cerdas/commit/50846be980ed74c3940f0bb36871e16909cc8953))
* resolve final type errors in useAppMetadata.ts ([cbcd723](https://github.com/ihkaru/cerdas/commit/cbcd7239d160eb849c1b30a5803a4696a1819909))
* resolve lint errors and add local verify scripts ([64ce003](https://github.com/ihkaru/cerdas/commit/64ce0037661f1df049ac80f4da37e4f80e7803f9))
* resolve map navigation error, fix geoUtils type break, and enhance excel import ([256a6d3](https://github.com/ihkaru/cerdas/commit/256a6d3ca6a611e19cd7f54c4ffba50a137d117a))
* resolve MapView build break ([cb2827d](https://github.com/ihkaru/cerdas/commit/cb2827d88ca44c6b85bc23488346b8ee8420a97f))
* resolve remaining vue-tsc errors in useAppMetadata.ts ([aaaec1c](https://github.com/ihkaru/cerdas/commit/aaaec1c8a4c7073f4e0e9b1c37da53e5952d00ff))
* resolve synchronization 404s, editor save 400s, and dynamic join link domain ([ade7fe1](https://github.com/ihkaru/cerdas/commit/ade7fe1cb911a2d9778a1a227f9170dcec4b449a))
* resolve vue v-if/v-for conflict and enable pre-commit hooks ([0cab18e](https://github.com/ihkaru/cerdas/commit/0cab18e27566166f7d5b359d3f333c362437c712))
* resolve vue-tsc build errors ([545a799](https://github.com/ihkaru/cerdas/commit/545a799016c2c1e5ead7324793bc1953bc52b4e6))
* stabilize dashboard sync and join flow cleanup ([996e318](https://github.com/ihkaru/cerdas/commit/996e318574974c67895497150c05d3760c8e755e))
* **sync:** logic improvements and lint fixes ([1213977](https://github.com/ihkaru/cerdas/commit/121397743ae0601028f74b817fd70a589f5102fb))
* **sync:** resolve lint errors ([f78c3f0](https://github.com/ihkaru/cerdas/commit/f78c3f0e3dc27ea5c36a57c4b9dc21b4e0b25524))
* **sync:** resolve rollback versioning issue and add comprehensive debug logs ([5573a98](https://github.com/ihkaru/cerdas/commit/5573a98e6203273421d3b7fa1adecf9018feee68))
* total stabilization of app join and dashboard ([17d166b](https://github.com/ihkaru/cerdas/commit/17d166b5e6c9d65f25357c8a763d3cb4cfee3400))
* **workflow:** harden discord notification and clean up build artifacts ([faa7d1e](https://github.com/ihkaru/cerdas/commit/faa7d1ef2453f036e3704f14d37b2b0a1c58a3db))


### Performance Improvements

* **backend:** remove logging from auth check ([1606f89](https://github.com/ihkaru/cerdas/commit/1606f89fdb950b38d527cad2be11b7ff75598db3))
* **client:** improve app shell load performance and UX ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))
* **docker:** introduce BuildKit cache mounts for instant NPM/Composer instals ([da24cf8](https://github.com/ihkaru/cerdas/commit/da24cf85f27b6f51224cd8d3a9a9c20333aa5b26))
* **docker:** optimize chown execution for instant builds ([97a2c62](https://github.com/ihkaru/cerdas/commit/97a2c621620957c5f4eabe38dd339c1c39dcd32a))
* enable OPcache, fix healthcheck, optimize Dockerfile for production ([158530f](https://github.com/ihkaru/cerdas/commit/158530fc8c4a3a41609b2d706dba71bd826c03d5))
* **map:** optimize buildGeoJson and add clustering config ([61c8019](https://github.com/ihkaru/cerdas/commit/61c80194d168d90680152492b76731350e6db9c3))

## [0.1.56](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.55...cerdas-v0.1.56) (2026-04-15)


### Bug Fixes

* stabilize dashboard sync and join flow cleanup ([996e318](https://github.com/ihkaru/cerdas/commit/996e318574974c67895497150c05d3760c8e755e))

## [0.1.55](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.54...cerdas-v0.1.55) (2026-04-15)


### Bug Fixes

* total stabilization of app join and dashboard ([17d166b](https://github.com/ihkaru/cerdas/commit/17d166b5e6c9d65f25357c8a763d3cb4cfee3400))

## [0.1.54](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.53...cerdas-v0.1.54) (2026-04-14)


### Bug Fixes

* add production domains to CORS allowed origins ([c278777](https://github.com/ihkaru/cerdas/commit/c27877750cbeaae88c76a3d0890e4bc47c2465bb))
* implement safety merge for CORS and Sanctum production domains ([e1c3fe5](https://github.com/ihkaru/cerdas/commit/e1c3fe5d95c2622475fdb4482195462bf38ebbbe))
* resolve final runtime and typescript errors in editor ([50846be](https://github.com/ihkaru/cerdas/commit/50846be980ed74c3940f0bb36871e16909cc8953))
* resolve synchronization 404s, editor save 400s, and dynamic join link domain ([ade7fe1](https://github.com/ihkaru/cerdas/commit/ade7fe1cb911a2d9778a1a227f9170dcec4b449a))

## [0.1.53](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.52...cerdas-v0.1.53) (2026-04-14)


### Bug Fixes

* remove unused ref import in useTableSelection.ts ([6e1f880](https://github.com/ihkaru/cerdas/commit/6e1f88028e8b60b0100f06192770bc2e0a0cfe59))
* resolve CI build failures (complexity and ignored exceptions) ([05546ab](https://github.com/ihkaru/cerdas/commit/05546ab003ba90d872bc8dd6f57aa8c9f22731fc))
* resolve CI build failures (unused variables and incorrect computed assignments) ([a83c0d1](https://github.com/ihkaru/cerdas/commit/a83c0d102b8b38d348a2c9455aeccbf886945765))

## [0.1.52](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.51...cerdas-v0.1.52) (2026-04-14)


### Features

* implement shareable join links and modernize google auth (April 2026 standards) ([aaa17ec](https://github.com/ihkaru/cerdas/commit/aaa17ec6ce10b5f98902f57af060b38030575840))
* stabilize editor and preview sync ([884475b](https://github.com/ihkaru/cerdas/commit/884475bef72ffc613138063cd219f825c7336374))

## [0.1.51](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.50...cerdas-v0.1.51) (2026-04-13)


### Bug Fixes

* **ci:** resolve module resolution issues and discord notification character limits ([1da12e5](https://github.com/ihkaru/cerdas/commit/1da12e56817d05c4d8b14f6a2a7eb93d3b78940b))
* **editor:** satisfy SSOT by adding metadata for new field types ([a466f1c](https://github.com/ihkaru/cerdas/commit/a466f1c2720b70bcd3cb5ede07aa7e0132e24b75))
* **form-engine:** resolve vue module resolution and type declaration errors ([ed70b52](https://github.com/ihkaru/cerdas/commit/ed70b52510cd82c1f379b461a540927e00028f3d))
* **workflow:** harden discord notification and clean up build artifacts ([faa7d1e](https://github.com/ihkaru/cerdas/commit/faa7d1ef2453f036e3704f14d37b2b0a1c58a3db))

## [0.1.50](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.49...cerdas-v0.1.50) (2026-04-13)


### Features

* complete local dev features and docker optimization ([3679883](https://github.com/ihkaru/cerdas/commit/3679883597e3a6d34b8683b49b1168916c079d2b))
* **form-engine:** add direct google maps directions link to smart detection tip ([c139f52](https://github.com/ihkaru/cerdas/commit/c139f52d3f17fd1e2fd16bdbafc9971f22f057f1))
* safe deletion, trash management, and TS strict fixes ([813ca49](https://github.com/ihkaru/cerdas/commit/813ca4956ea07170831632195401314654454624))


### Bug Fixes

* **client:** recreate sqlite schema instantly during local db reset to prevent no such table errors ([186599b](https://github.com/ihkaru/cerdas/commit/186599bff93e692668823c68a4ad94b54fbfc694))
* **form-engine:** resolve gps field rendering issues and add smart coordinate detection ([81442af](https://github.com/ihkaru/cerdas/commit/81442af4e99bcd2d9535ae66a1657e0b89c0a642))
* **queue:** extend worker max-time to 4h to prevent excel imports from crashing mid-execution ([59f4265](https://github.com/ihkaru/cerdas/commit/59f42652c502b8b4d51f0ffc60b8f2d3ca3fe7a4))
* **queue:** harden queue worker auto-restart script ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))


### Performance Improvements

* **client:** improve app shell load performance and UX ([033a668](https://github.com/ihkaru/cerdas/commit/033a668b9266cc5acca22a6761ad9aac9546f9d4))
* **docker:** introduce BuildKit cache mounts for instant NPM/Composer instals ([da24cf8](https://github.com/ihkaru/cerdas/commit/da24cf85f27b6f51224cd8d3a9a9c20333aa5b26))
* **docker:** optimize chown execution for instant builds ([97a2c62](https://github.com/ihkaru/cerdas/commit/97a2c621620957c5f4eabe38dd339c1c39dcd32a))

## [0.1.49](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.48...cerdas-v0.1.49) (2026-02-17)


### Performance Improvements

* **backend:** remove logging from auth check ([1606f89](https://github.com/ihkaru/cerdas/commit/1606f89fdb950b38d527cad2be11b7ff75598db3))

## [0.1.48](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.47...cerdas-v0.1.48) (2026-02-17)


### Bug Fixes

* **backend:** increase upload memory limit and clarify health check timeout ([342acd5](https://github.com/ihkaru/cerdas/commit/342acd53123e3e0c9f7238614bccd3a0547af63a))

## [0.1.47](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.46...cerdas-v0.1.47) (2026-02-17)


### Features

* **client:** remove pagination from assignment list ([23505ed](https://github.com/ihkaru/cerdas/commit/23505ed0ed00722c46d0ecc40505ac4667d4094e))
* **client:** update header title to use view name ([2731b92](https://github.com/ihkaru/cerdas/commit/2731b92cd27854b0378c08bc4ab70ca476b21314))

## [0.1.46](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.45...cerdas-v0.1.46) (2026-02-17)


### Bug Fixes

* **client:** optimize map cluster memory & enable largeHeap for stability ([9785eff](https://github.com/ihkaru/cerdas/commit/9785eff42ce4be371824098b4fbde34d3b4b0add))

## [0.1.45](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.44...cerdas-v0.1.45) (2026-02-17)


### Bug Fixes

* **client:** remove commented out code in SyncService.ts to satisfy CI linter ([5ad5749](https://github.com/ihkaru/cerdas/commit/5ad5749ec848ecb8c44571592b3292c7886273ae))

## [0.1.44](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.43...cerdas-v0.1.44) (2026-02-17)


### Features

* **client:** implement async map rendering engine and simple memory optimizations ([01ed9df](https://github.com/ihkaru/cerdas/commit/01ed9df32694fc4c90349402d06c55d6febfa57d))


### Bug Fixes

* **client:** resolve SyncService type errors blocking build ([c7d6dbd](https://github.com/ihkaru/cerdas/commit/c7d6dbdf0e02ff43493876edc5fd6d89559958c5))
* **editor:** Live Preview Reactivity, GroupBy Logic & UX ([6f489c2](https://github.com/ihkaru/cerdas/commit/6f489c2e7a07bc945891609dab8390fff2718aed))

## [0.1.43](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.42...cerdas-v0.1.43) (2026-02-16)


### Features

* **editor:** improve UX hierarchy and optimize map view ([b5121e0](https://github.com/ihkaru/cerdas/commit/b5121e04265d5db4b2cb3284687bf400700c9472))


### Bug Fixes

* **client:** import App type in DashboardRepository ([f08d5b4](https://github.com/ihkaru/cerdas/commit/f08d5b4af3ee90bb52ae8dfc2b08beaa3c3e0858))
* **client:** rename unused variable in AppGallery ([b2a3450](https://github.com/ihkaru/cerdas/commit/b2a3450646c1e58de9d0447c69c855d1e68f1da9))
* **client:** resolve TypeScript error in useAppShellLogic ([3217cd2](https://github.com/ihkaru/cerdas/commit/3217cd239559424ecf0e907e1bf7cc8fb164d988))

## [0.1.42](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.41...cerdas-v0.1.42) (2026-02-16)


### Performance Improvements

* **map:** optimize buildGeoJson and add clustering config ([61c8019](https://github.com/ihkaru/cerdas/commit/61c80194d168d90680152492b76731350e6db9c3))

## [0.1.41](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.40...cerdas-v0.1.41) (2026-02-16)


### Features

* optimize map view, add google basemap toggle, and fix pagination ([4818e20](https://github.com/ihkaru/cerdas/commit/4818e2096add1ddd9e2ec30fba3d55ba9ee707df))

## [0.1.40](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.39...cerdas-v0.1.40) (2026-02-14)


### Bug Fixes

* **backend:** prepend HandleCors middleware to prevent intermittent CORS errors ([c47926c](https://github.com/ihkaru/cerdas/commit/c47926c917e07560d3a8bd048008c45c04461a9d))
* **docker:** audit production setup, fix CORS, remove redundancies ([ede4052](https://github.com/ihkaru/cerdas/commit/ede4052f9073569812fab8888c9c574747988223))

## [0.1.39](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.38...cerdas-v0.1.39) (2026-02-14)


### Bug Fixes

* **backend:** prevent calling total() on cursor paginator log ([5770e4b](https://github.com/ihkaru/cerdas/commit/5770e4b69e0aab1f996a5da6d3548140cae14e7b))
* **client:** ensure sync updates correct local table record ([c675019](https://github.com/ihkaru/cerdas/commit/c6750197bc1a6d0bfed3b8eacefe9f6caecdffec))

## [0.1.38](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.37...cerdas-v0.1.38) (2026-02-14)


### Features

* bypass 2000 record limit via cursor pagination for mobile sync ([32279f3](https://github.com/ihkaru/cerdas/commit/32279f38e8859add95a9f33fef0530396afd4fa9))


### Bug Fixes

* **sync:** logic improvements and lint fixes ([1213977](https://github.com/ihkaru/cerdas/commit/121397743ae0601028f74b817fd70a589f5102fb))
* **sync:** resolve lint errors ([f78c3f0](https://github.com/ihkaru/cerdas/commit/f78c3f0e3dc27ea5c36a57c4b9dc21b4e0b25524))

## [0.1.37](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.36...cerdas-v0.1.37) (2026-02-14)


### Features

* add hybrid dev workflow (local frontend + docker backend) ([4616e04](https://github.com/ihkaru/cerdas/commit/4616e04650315efaec55291d911d0daeb0c1466e))


### Bug Fixes

* add shared storage volume for production uploads ([912414d](https://github.com/ihkaru/cerdas/commit/912414dbb58099ce33d4c468298d313ac82f0542))
* markdown formatting ([a73f850](https://github.com/ihkaru/cerdas/commit/a73f85035f0b2c6f368dccd470c457bf3083f4cc))
* remove console.log to satisfy linter ([7e8477f](https://github.com/ihkaru/cerdas/commit/7e8477ff9070debce1968aa333d0055aca7be20c))

## [0.1.36](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.35...cerdas-v0.1.36) (2026-02-14)


### Features

* complete excel import robustness and cleanup backend styles ([7be6944](https://github.com/ihkaru/cerdas/commit/7be69446d1b74ecc4ff25d8a138608af8a1bbf0d))
* complete excel import robustness with batch splitting and job logging ([0cb12b7](https://github.com/ihkaru/cerdas/commit/0cb12b7148ca4f8a99c316c6db6bfc32305c4dfc))


### Bug Fixes

* correctly type and disable lint warnings for GpsField ([32c2f52](https://github.com/ihkaru/cerdas/commit/32c2f527d91bae34e24c46c984cdbdf6770f186f))
* **editor:** fix broken relative import paths in store tests ([4aaae56](https://github.com/ihkaru/cerdas/commit/4aaae5668f17854a893de965afab63b2dd1e477c))
* **form-engine:** fix unknown type error in geoUtils ([b11997e](https://github.com/ihkaru/cerdas/commit/b11997eb45f77f285bac2a2d94179a3f2a707633))
* resolve map navigation error, fix geoUtils type break, and enhance excel import ([256a6d3](https://github.com/ihkaru/cerdas/commit/256a6d3ca6a611e19cd7f54c4ffba50a137d117a))
* resolve MapView build break ([cb2827d](https://github.com/ihkaru/cerdas/commit/cb2827d88ca44c6b85bc23488346b8ee8420a97f))

## [0.1.35](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.34...cerdas-v0.1.35) (2026-02-14)


### Bug Fixes

* **client:** resolve assignment detail empty data race condition and other improvements ([8d829eb](https://github.com/ihkaru/cerdas/commit/8d829ebfdf8e7fc8f8a541379487adb6d94dd80d))

## [0.1.34](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.33...cerdas-v0.1.34) (2026-02-14)


### Bug Fixes

* **ci:** remove unused interfaces and resolve type mismatch ([b736abe](https://github.com/ihkaru/cerdas/commit/b736abef7223bbafd82a4f6ac6dcf50127f487aa))
* **lint:** resolve remaining 20 lint errors and warnings ([be0b8d9](https://github.com/ihkaru/cerdas/commit/be0b8d969d10d60ab6edf858257ed94a2a547c42))
* resolve lint errors and add local verify scripts ([64ce003](https://github.com/ihkaru/cerdas/commit/64ce0037661f1df049ac80f4da37e4f80e7803f9))

## [0.1.33](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.32...cerdas-v0.1.33) (2026-02-14)


### Bug Fixes

* critical bug in SyncService orphan cleanup destroying all synced assignments ([61cdc47](https://github.com/ihkaru/cerdas/commit/61cdc4797ca509b41180354851e4703932f39317))
* resolve final type errors in useAppMetadata.ts ([cbcd723](https://github.com/ihkaru/cerdas/commit/cbcd7239d160eb849c1b30a5803a4696a1819909))
* resolve remaining vue-tsc errors in useAppMetadata.ts ([aaaec1c](https://github.com/ihkaru/cerdas/commit/aaaec1c8a4c7073f4e0e9b1c37da53e5952d00ff))
* resolve vue-tsc build errors ([545a799](https://github.com/ihkaru/cerdas/commit/545a799016c2c1e5ead7324793bc1953bc52b4e6))

## [0.1.32](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.31...cerdas-v0.1.32) (2026-02-14)


### Bug Fixes

* **client:** enable grouping transition animation across levels ([2dcc456](https://github.com/ihkaru/cerdas/commit/2dcc45601f45c28e9181c06f3ac18ffea2c47f7e))
* **dashboard:** resolve assignment filter/sort status counts, z-index, and search bugs ([5188b37](https://github.com/ihkaru/cerdas/commit/5188b37ed871f514cebedfea99657a9bc6ae2b33))

## [0.1.31](https://github.com/ihkaru/cerdas/compare/cerdas-v0.1.30...cerdas-v0.1.31) (2026-02-13)


### Features

* **editor:** implement schema reference, copy fallback, and validation for logic editors ([3f216ca](https://github.com/ihkaru/cerdas/commit/3f216ca1536590f9ec017e66a60e713b93be57ac))

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

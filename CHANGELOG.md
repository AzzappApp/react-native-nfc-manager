## 0.5.15-canary.100

* **build:**  - remove useless dep
* **build:**  - try with build:web script
* **build:**  - move dependency to subpackage
* **build:**  - try to upgrade yarn version
* **build:**  - remove useless scripts
* **build:**  - fix app-dependencies script
* **build:**  - change restore terminal ([#3597](https://github.com/AzzappApp/azzapp/pull/3597))
* **build:**  - upgrade to turbo v2 ([#3595](https://github.com/AzzappApp/azzapp/pull/3595))
* **feat:**  - simplify mediaId mgmt ([#3592](https://github.com/AzzappApp/azzapp/pull/3592))
* **fix:**  - fix build
* **fix:**  - android home information on fistr render
* **feat:**  - 🎸 inform subscription is on webapp when needed ([#3594](https://github.com/AzzappApp/azzapp/pull/3594))
* **fix:**  - new release test for HomeInformations
* **fix:**  - cover perf improvments ([#3596](https://github.com/AzzappApp/azzapp/pull/3596))
* **fix:**  - **deepLink:** handle case when emailSignature is opened on mobile ([#3574](https://github.com/AzzappApp/azzapp/pull/3574))
* **fix:**  - warning on forward ref ([#3593](https://github.com/AzzappApp/azzapp/pull/3593))
* **fix:**  - **web:** static cover case with video cover ([#3583](https://github.com/AzzappApp/azzapp/pull/3583))
* **fix:**  - typecheck
* **fix:**  - **cover:** wrong target while creating cover ([#3584](https://github.com/AzzappApp/azzapp/pull/3584))
* **fix:**  - remove prod log for test
* **fix:**  - prod test for evg (to be reverted)
* **fix:**  - email signature using png image to avoid dark background ([#3576](https://github.com/AzzappApp/azzapp/pull/3576))
* **fix:**  - 🐛 remove next button ([#3578](https://github.com/AzzappApp/azzapp/pull/3578))
* **feat:**  - **user:** [#3558](https://github.com/AzzappApp/azzapp/pull/3558) delete user option ([#3575](https://github.com/AzzappApp/azzapp/pull/3575))
* **fix:**  - try something for android issue ([#3577](https://github.com/AzzappApp/azzapp/pull/3577))
* **feat:**  - confirm template ([#3566](https://github.com/AzzappApp/azzapp/pull/3566))
* **perf:**  - **post:** [#3435](https://github.com/AzzappApp/azzapp/pull/3435) try to improve performance while editing video ([#3568](https://github.com/AzzappApp/azzapp/pull/3568))
* **fix:**  - **webCard:** [#3562](https://github.com/AzzappApp/azzapp/pull/3562) check role on cover creation ([#3569](https://github.com/AzzappApp/azzapp/pull/3569))
* **fix:**  - warning on startup with rn 0.74 ([#3573](https://github.com/AzzappApp/azzapp/pull/3573))
* **fix:**  - **android:** we can’t filter subpath
* **feat:**  - allow to share the cover video directly ([#3572](https://github.com/AzzappApp/azzapp/pull/3572))
* **fix:**  - **android:** [#3435](https://github.com/AzzappApp/azzapp/pull/3435) try another pathPattern ([#3571](https://github.com/AzzappApp/azzapp/pull/3571))
* **feat:**  - use lottie ([#3557](https://github.com/AzzappApp/azzapp/pull/3557))
* **feat:**  - all link to webcard around emial signature logo ([#3567](https://github.com/AzzappApp/azzapp/pull/3567))
* **feat:**  - **cover:** remove cover api with new cover ([#3565](https://github.com/AzzappApp/azzapp/pull/3565))
* **feat:**  - **CoverEdition:** basic functional cover editor ([#3563](https://github.com/AzzappApp/azzapp/pull/3563))
* **feat:**  - apply effet properly ([#3556](https://github.com/AzzappApp/azzapp/pull/3556))
* **fix:**  - **user:** check validation result ([#3554](https://github.com/AzzappApp/azzapp/pull/3554))
* **Feat:**  - CoverEditor adjust Tolol ([#3553](https://github.com/AzzappApp/azzapp/pull/3553))
* **fix:**  - **emailSignature:** [#3543](https://github.com/AzzappApp/azzapp/pull/3543) don’t crash when lottie is missing ([#3550](https://github.com/AzzappApp/azzapp/pull/3550))
* **feat:**  - **webCard:** [#3244](https://github.com/AzzappApp/azzapp/pull/3244) add activity types ([#3552](https://github.com/AzzappApp/azzapp/pull/3552))
* **fix:**  - [#3365](https://github.com/AzzappApp/azzapp/pull/3365) issue on legal link in second screen ([#3551](https://github.com/AzzappApp/azzapp/pull/3551))
* **build:**  - update babel-plugin for formatjs
* **build:**  - rollback sentry upgrade ([#3549](https://github.com/AzzappApp/azzapp/pull/3549))
* **build:**  - upgrade web dependencies ([#3547](https://github.com/AzzappApp/azzapp/pull/3547))
* **fix:**  - **media:** [#3476](https://github.com/AzzappApp/azzapp/pull/3476) try to slow down updates ([#3545](https://github.com/AzzappApp/azzapp/pull/3545))
* **fix:**  - lint issue
* **feat:**  - CoverEditor animate for media and overlay, including effect for media image ([#3544](https://github.com/AzzappApp/azzapp/pull/3544))
* **fix:**  - **webCard:** check correctly update date ([#3542](https://github.com/AzzappApp/azzapp/pull/3542))
* **fix:**  - consider a subscription as active until it ends ([#3540](https://github.com/AzzappApp/azzapp/pull/3540))
* **fix:**  - update monthly subscription when users are removed ([#3539](https://github.com/AzzappApp/azzapp/pull/3539))
* **feat:**  - Cover migrate overlay media ([#3538](https://github.com/AzzappApp/azzapp/pull/3538))
* **fix:**  - add default firstname and lastname values to generate an invoice ([#3537](https://github.com/AzzappApp/azzapp/pull/3537))
* **fix:**  - **media:** [#3476](https://github.com/AzzappApp/azzapp/pull/3476) ensure we are using the last selected value ([#3536](https://github.com/AzzappApp/azzapp/pull/3536))
* **fix:**  - **logo:** [#3521](https://github.com/AzzappApp/azzapp/pull/3521) accept wider aspect ratios ([#3525](https://github.com/AzzappApp/azzapp/pull/3525))
* **feat:**  - coverEdition - fix bottom sheet sizing , use a common box list … ([#3535](https://github.com/AzzappApp/azzapp/pull/3535))
* **fix:**  - **android:** [#3435](https://github.com/AzzappApp/azzapp/pull/3435) fingerprints were not updated after package name changes ([#3532](https://github.com/AzzappApp/azzapp/pull/3532))
* **fix:**  - **contactCard:** [#3504](https://github.com/AzzappApp/azzapp/pull/3504) missing fields in stored contact in contact book ([#3528](https://github.com/AzzappApp/azzapp/pull/3528))
* **feat:**  - add cover transition ([#3533](https://github.com/AzzappApp/azzapp/pull/3533))
* **feat:**  - add apple meta info ([#3531](https://github.com/AzzappApp/azzapp/pull/3531))
* **build:**  - remove expo-font patch ([#3530](https://github.com/AzzappApp/azzapp/pull/3530))
* **build:**  - increase ios resource class to avoid build failures
* **feat:**  - 🎸 add cover template type ([#3511](https://github.com/AzzappApp/azzapp/pull/3511))
* **feat:**  - **CoverEdition:** loading system ([#3529](https://github.com/AzzappApp/azzapp/pull/3529))
* **fix:**  - use correct mailto and logo ([#3526](https://github.com/AzzappApp/azzapp/pull/3526))
* **feat:**  - **Cover:** basic cover preview for medias ([#3523](https://github.com/AzzappApp/azzapp/pull/3523))
* **fix:**  - **home:** [#3515](https://github.com/AzzappApp/azzapp/pull/3515) memoize icon to avoid tintColor issue on rerender ([#3524](https://github.com/AzzappApp/azzapp/pull/3524))
* **fix:**  - only returns subscriptions on user ([#3522](https://github.com/AzzappApp/azzapp/pull/3522))
* **feat:**  - **subscription:** add issuer in graphql api ([#3519](https://github.com/AzzappApp/azzapp/pull/3519))
* **fix:**  - signature email review ([#3516](https://github.com/AzzappApp/azzapp/pull/3516))
* **fix:**  - **contactCard:** [#3507](https://github.com/AzzappApp/azzapp/pull/3507) check status response ([#3517](https://github.com/AzzappApp/azzapp/pull/3517))
* **fix:**  - **home:** [#3515](https://github.com/AzzappApp/azzapp/pull/3515) clash in tint colors ([#3518](https://github.com/AzzappApp/azzapp/pull/3518))
* **fix:**  - **media:** [#3508](https://github.com/AzzappApp/azzapp/pull/3508) apply rotation on decoder resolution ([#3514](https://github.com/AzzappApp/azzapp/pull/3514))
* **fix:**  - error on font reload ([#3509](https://github.com/AzzappApp/azzapp/pull/3509))
* **fix:**  - **webCard:** [#3469](https://github.com/AzzappApp/azzapp/pull/3469) cascade delete on post when webcard is removed ([#3492](https://github.com/AzzappApp/azzapp/pull/3492))
* **feat:**  - configure regions in production ([#3494](https://github.com/AzzappApp/azzapp/pull/3494))
* **fix:**  - **multiUser:** [#3497](https://github.com/AzzappApp/azzapp/pull/3497) support png files for logos ([#3501](https://github.com/AzzappApp/azzapp/pull/3501))
* **fix:**  - **PosctCreationScreen:** improve memory usage on IOS ([#3502](https://github.com/AzzappApp/azzapp/pull/3502))
* **feat:**  - add free seats ([#3495](https://github.com/AzzappApp/azzapp/pull/3495))
* **fix:**  - **payment:** use subscription id in payments ([#3461](https://github.com/AzzappApp/azzapp/pull/3461))
* **fix:**  - **payment:** wrong amount per year ([#3483](https://github.com/AzzappApp/azzapp/pull/3483))
* **build:**  - try with alias import
* **docs:**  - update Xcode version
* **build:**  - move payment script to payment package ([#3390](https://github.com/AzzappApp/azzapp/pull/3390))
* **fix:**  - 🐛 correctly display video player ([#3486](https://github.com/AzzappApp/azzapp/pull/3486))
* **feat:**  - 🎸 start media implementation ([#3470](https://github.com/AzzappApp/azzapp/pull/3470))
* **build:**  - change clean command
* **fix:**  - Restore cover menu behavior ([#3480](https://github.com/AzzappApp/azzapp/pull/3480))
* **build:**  - try to build within vercel
* **build:**  - upgrade iron-webcrypto
* **feat:**  - **Media:** replace GPUView with Skia ([#3432](https://github.com/AzzappApp/azzapp/pull/3432))
* **fix:**  - **multiUser:** [#3450](https://github.com/AzzappApp/azzapp/pull/3450) check subscription of owner ([#3451](https://github.com/AzzappApp/azzapp/pull/3451))
* **fix:**  - **home:** [#3340](https://github.com/AzzappApp/azzapp/pull/3340) use value as closest as possible ([#3467](https://github.com/AzzappApp/azzapp/pull/3467))
* **fix:**  - warning on forward ref ([#3452](https://github.com/AzzappApp/azzapp/pull/3452))
* **fix:**  - **payment:** wrong id used in upgrade ([#3454](https://github.com/AzzappApp/azzapp/pull/3454))
* **fix:**  - **payment:** incorrect id used in upgrade plan update ([#3453](https://github.com/AzzappApp/azzapp/pull/3453))
* **fix:**  - many errors due to pr [#3440](https://github.com/AzzappApp/azzapp/pull/3440) ([#3449](https://github.com/AzzappApp/azzapp/pull/3449))
* **build:**  - fix podfile
* **fix:**  - **multiUser:** [#3353](https://github.com/AzzappApp/azzapp/pull/3353) avatar is overriden by exportVcf ([#3445](https://github.com/AzzappApp/azzapp/pull/3445))
* **fix:**  - **multiUser:** [#3444](https://github.com/AzzappApp/azzapp/pull/3444) one tap to open user ([#3446](https://github.com/AzzappApp/azzapp/pull/3446))
* **fix:**  - **multiUser:** [#3443](https://github.com/AzzappApp/azzapp/pull/3443) crash on expo-contacts ([#3448](https://github.com/AzzappApp/azzapp/pull/3448))
* **feat:**  - cover v2 (Main branch for the new cover) ([#3373](https://github.com/AzzappApp/azzapp/pull/3373))
* **build:**  - increment version according to branch
* **fix:**  - **webCard:** [#3341](https://github.com/AzzappApp/azzapp/pull/3341) on publication looks for owner instead of current user ([#3434](https://github.com/AzzappApp/azzapp/pull/3434))
* **fix:**  - **payment:** check for rebill manager status ([#3439](https://github.com/AzzappApp/azzapp/pull/3439))
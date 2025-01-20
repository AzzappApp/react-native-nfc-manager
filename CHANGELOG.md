## 1.7.0-canary.29

* **fix:**  - rework buildLocalContact to ensure expo contact is well created ([#6980](https://github.com/AzzappApp/azzapp/pull/6980))
* **fix:**  - **deepLink:** [#6158](https://github.com/AzzappApp/azzapp/pull/6158) don’t route to home (router don’t support it) ([#6966](https://github.com/AzzappApp/azzapp/pull/6966))
* **feat:**  - **home:** tooltip text updates ([#6967](https://github.com/AzzappApp/azzapp/pull/6967))
* **fix:**  - **payment:** [#5176](https://github.com/AzzappApp/azzapp/pull/5176) add a way to run manually cron ([#6974](https://github.com/AzzappApp/azzapp/pull/6974))
* **fix:**  - refresh permission state after opening settings ([#6742](https://github.com/AzzappApp/azzapp/pull/6742))
* **fix:**  - **cover:** [#6946](https://github.com/AzzappApp/azzapp/pull/6946) cover with no template case ([#6965](https://github.com/AzzappApp/azzapp/pull/6965))
* **fix:**  - **multiUser:** [#6957](https://github.com/AzzappApp/azzapp/pull/6957) push new invited value + simplify profile infos… ([#6959](https://github.com/AzzappApp/azzapp/pull/6959))
* **fix:**  - add a see webcard button ([#6887](https://github.com/AzzappApp/azzapp/pull/6887))
* **fix:**  - on auth profileInfos are partial
* **fix:**  - on auth profileInfos are partial
* **fix:**  - **home:** [#6951](https://github.com/AzzappApp/azzapp/pull/6951) update coverIsPredefined field ([#6953](https://github.com/AzzappApp/azzapp/pull/6953))
* **fix:**  - truncated covers in search contact ByName ([#6952](https://github.com/AzzappApp/azzapp/pull/6952))
* **fix:**  - ensure module is stored in replica
* **fix:**  - browser square ([#6950](https://github.com/AzzappApp/azzapp/pull/6950))
* **docs:**  - Update README.md ([#6949](https://github.com/AzzappApp/azzapp/pull/6949))
* **fix:**  - **cover:** [#6909](https://github.com/AzzappApp/azzapp/pull/6909) download files directly to target path ([#6917](https://github.com/AzzappApp/azzapp/pull/6917))
* **fix:**  - **cover:** [#6946](https://github.com/AzzappApp/azzapp/pull/6946) file prefix is not supported by skia-video when handling video ([#6948](https://github.com/AzzappApp/azzapp/pull/6948))
* **fix:**  - slow down profile change
* **fix:**  - slow down module saving to avoid crash on android
* **fix:**  - **community:** [#6925](https://github.com/AzzappApp/azzapp/pull/6925) don’t browse to community when not allowed ([#6928](https://github.com/AzzappApp/azzapp/pull/6928))
* **fix:**  - remove storage widget for android (no widget for now) ([#6938](https://github.com/AzzappApp/azzapp/pull/6938))
* **fix:**  - ensure contact detail screen redirect to the app when clicking on webcard url ([#6886](https://github.com/AzzappApp/azzapp/pull/6886))
* **fix:**  - **media:** [#6927](https://github.com/AzzappApp/azzapp/pull/6927) separate promise per dir
* **fix:**  - **media:** [#6927](https://github.com/AzzappApp/azzapp/pull/6927) isDir looks strange in the code
* **fix:**  - be sure item is defined
* **feat:**  - use grid module to render original ratio (similar to web) ([#6923](https://github.com/AzzappApp/azzapp/pull/6923))
* **Fix:**  -  square grid . Remove original item component and use Grid ([#6921](https://github.com/AzzappApp/azzapp/pull/6921))
* **fix:**  - update MARKETING_VERSION and CURRENT_PROJECT_VERSION of all scheme (help building extension) ([#6891](https://github.com/AzzappApp/azzapp/pull/6891))
* **fix:**  - do not decrease toast text size ([#6913](https://github.com/AzzappApp/azzapp/pull/6913))
* **build:**  - configure sourcemaps on sentry ([#6914](https://github.com/AzzappApp/azzapp/pull/6914))
* **fix:**  - temporary disable module count limit ([#6908](https://github.com/AzzappApp/azzapp/pull/6908))
* **fix:**  - appClip welcome screen (apple review) ([#6910](https://github.com/AzzappApp/azzapp/pull/6910))
* **fix:**  - do not corrupt already built url addresses ([#6906](https://github.com/AzzappApp/azzapp/pull/6906))
* **feat:**  - **user:** [#6880](https://github.com/AzzappApp/azzapp/pull/6880) no more create free subscription ([#6901](https://github.com/AzzappApp/azzapp/pull/6901))
* **fix:**  - **webCard:** [#6895](https://github.com/AzzappApp/azzapp/pull/6895) always pass a value as profile id ([#6902](https://github.com/AzzappApp/azzapp/pull/6902))
* **feat:**  - disable multi user on android ([#6894](https://github.com/AzzappApp/azzapp/pull/6894))
* **fix:**  - ensure view doesn't cover buton ([#6893](https://github.com/AzzappApp/azzapp/pull/6893))
* **fix:**  - download correctly avatar from phone contacts ([#6883](https://github.com/AzzappApp/azzapp/pull/6883))
* **fix:**  - **likes:** [#6888](https://github.com/AzzappApp/azzapp/pull/6888) [#6889](https://github.com/AzzappApp/azzapp/pull/6889) properly fix fragments
* **fix:**  - put back waitTime
* **fix:**  - ensure contact details modal is fullscreen ([#6884](https://github.com/AzzappApp/azzapp/pull/6884))
* **fix:**  - **likes:** [#6888](https://github.com/AzzappApp/azzapp/pull/6888) missing fragment
* **fix:**  - **following:** [#6889](https://github.com/AzzappApp/azzapp/pull/6889) missing fragment
* **fix:**  - put back waitTime
* **fix:**  - adding media on existing module
* **fix:**  - adding media on existing module
* **fix:**  - **profile:** [#6881](https://github.com/AzzappApp/azzapp/pull/6881) ensure profile is on replica
* **fix:**  - allow to duplicate hidden module ([#6869](https://github.com/AzzappApp/azzapp/pull/6869))
* **fix:**  - fix ordering management and remove duplicated callbacks ([#6873](https://github.com/AzzappApp/azzapp/pull/6873))
* **feat:**  - Grid square module ([#6872](https://github.com/AzzappApp/azzapp/pull/6872))
* **fix:**  - reduce gap between header and description in popups ([#6863](https://github.com/AzzappApp/azzapp/pull/6863))
* **feat:**  - Media Grid module ([#6840](https://github.com/AzzappApp/azzapp/pull/6840))
* **fix:**  - hide toast when changing webcard type ([#6860](https://github.com/AzzappApp/azzapp/pull/6860))
* **fix:**  - do not overflow hidden, it causes a border of cancel button to be cut ([#6858](https://github.com/AzzappApp/azzapp/pull/6858))
* **fix:**  - [#6462](https://github.com/AzzappApp/azzapp/pull/6462) ensure reads are made on primary after mutation ([#6581](https://github.com/AzzappApp/azzapp/pull/6581))
* **build:**  - upgrade native deps ([#6853](https://github.com/AzzappApp/azzapp/pull/6853))
* **fix:**  - limit url width on home screen ([#6817](https://github.com/AzzappApp/azzapp/pull/6817))
* **fix:**  - media picker should not closed with empty slots ([#6846](https://github.com/AzzappApp/azzapp/pull/6846))
* **feat:**  - Full alternation ([#6797](https://github.com/AzzappApp/azzapp/pull/6797))
* **fix:**  - forbid follow, like and post when cover is predefined and display popup accordingly ([#6818](https://github.com/AzzappApp/azzapp/pull/6818))
* **fix:**  - [#6556](https://github.com/AzzappApp/azzapp/pull/6556) simplify file management ([#6715](https://github.com/AzzappApp/azzapp/pull/6715))
* **fix:**  - widget skd17 minimal version
* **feat:**  - force widget minimum os deployment to 16
* **fix:**  - testflight
* **fix:**  - widget entitlement
* **fix:**  - wrong mobile provision
* **feat:**  - update revoked mobile provision. use local config is fastlane as it will break the staging config (and we are working on stagingà
* **fix:**  - try to make fastfile working....
* **fix:**  - fastlane typo
* **fix:**  - fastlane
* **fix:**  - ci build widget provisionnning profile ([#6779](https://github.com/AzzappApp/azzapp/pull/6779))
* **feat:**  - initial version widget iOS ([#6752](https://github.com/AzzappApp/azzapp/pull/6752))
* **fix:**  - **post:** [#6207](https://github.com/AzzappApp/azzapp/pull/6207) have same behaviour on android and iOS (on iOS the removed pressable is ignored) ([#6747](https://github.com/AzzappApp/azzapp/pull/6747))
* **fix:**  - **contact:** [#6622](https://github.com/AzzappApp/azzapp/pull/6622) properly handle avatar ([#6732](https://github.com/AzzappApp/azzapp/pull/6732))
* **fix:**  - **modules:** [#6701](https://github.com/AzzappApp/azzapp/pull/6701) wrong color on desktop preview with new modules ([#6724](https://github.com/AzzappApp/azzapp/pull/6724))
* **fix:**  - **modules:** [#6371](https://github.com/AzzappApp/azzapp/pull/6371) pressableNative is unresponsive on large scale on… ([#6718](https://github.com/AzzappApp/azzapp/pull/6718))
* **fix:**  - don’t use navigator on ssr ([#6719](https://github.com/AzzappApp/azzapp/pull/6719))
* **fix:**  - move shareAndShare description text outside of the qrcode container ([#6708](https://github.com/AzzappApp/azzapp/pull/6708))
* **WebCard:**  - try to limit the number of video running in alternation and parallax using viewport ([#6673](https://github.com/AzzappApp/azzapp/pull/6673))
* **feat:**  - go to home on invit received with no contact card ([#6615](https://github.com/AzzappApp/azzapp/pull/6615))
* **fix:**  - media renderer ([#6438](https://github.com/AzzappApp/azzapp/pull/6438))
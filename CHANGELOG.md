## 0.5.21-canary.47

* **fix:**  - BoxSelection , set initial index only if width is fixed ([#4546](https://github.com/AzzappApp/azzapp/pull/4546))
* **fix:**  - put back field for backward compatibility ([#4543](https://github.com/AzzappApp/azzapp/pull/4543))
* **fix:**  -  search user in backoffice ([#4537](https://github.com/AzzappApp/azzapp/pull/4537))
* **fix:**  - remove google wallet button ([#4539](https://github.com/AzzappApp/azzapp/pull/4539))
* **fix:**  - 🐛 change text as expected ([#4536](https://github.com/AzzappApp/azzapp/pull/4536))
* **fix:**  - add free beta period for invited users ([#4534](https://github.com/AzzappApp/azzapp/pull/4534))
* **fix:**  - **android:** increase hitSlop
* **fix:**  - children may be hard to be clicked when overlapping bounds ([#4532](https://github.com/AzzappApp/azzapp/pull/4532))
* **fix:**  - **CoverEditor:** edition button unreachable on layers
* **fix:**  - unit tests
* **fix:**  - SignUpScreen tests
* **build:**  - replace DATABASE_URL
* **fix:**  - don’t try to set unsupported locale
* **build:**  - pass vars and secrets
* **fix:**  - put back DATABASE_URL
* **fix:**  - remove usless comma
* **fix:**  - use DATABASE_USERNAME & DATABASE_PASSWORD to pull translations
* **fix:**  - color choose, better placement of label ([#4525](https://github.com/AzzappApp/azzapp/pull/4525))
* **fix:**  - store user primary locale instead of used one ([#4523](https://github.com/AzzappApp/azzapp/pull/4523))
* **fix:**  - don't allow post action is webcard is sitll invited ([#4519](https://github.com/AzzappApp/azzapp/pull/4519))
* **fix:**  - **webCard:** [#4509](https://github.com/AzzappApp/azzapp/pull/4509) don’t open optimistic duplicated module ([#4516](https://github.com/AzzappApp/azzapp/pull/4516))
* **fix:**  - **CoverEditor:** improve handle touch
* **fix:**  - 🐛 don't crash on empty post media ([#4515](https://github.com/AzzappApp/azzapp/pull/4515))
* **fix:**  - **contactCard:** [#4503](https://github.com/AzzappApp/azzapp/pull/4503) update contactCardUrl in cache ([#4506](https://github.com/AzzappApp/azzapp/pull/4506))
* **fix:**  - contactCardProps
* **feat:**  - add edit button on hom contact card ([#4508](https://github.com/AzzappApp/azzapp/pull/4508))
* **fix:**  - **contactCard:** wrong contactCard class for google wallet ([#4507](https://github.com/AzzappApp/azzapp/pull/4507))
* **fix:**  - ex owner ([#4477](https://github.com/AzzappApp/azzapp/pull/4477))
* **fix:**  - 🐛 configure fonts for android ([#4500](https://github.com/AzzappApp/azzapp/pull/4500))
* **fix:**  - 🐛 complete phone number validator removal ([#4499](https://github.com/AzzappApp/azzapp/pull/4499))
* **build:**  - fix config file
* **fix:**  - landscape android never work ([#4493](https://github.com/AzzappApp/azzapp/pull/4493))
* **feat:**  - preview email signature ([#4486](https://github.com/AzzappApp/azzapp/pull/4486))
* **fix:**  - **WebCard:** Module background image resolver
* **fix:**  - allow user that have a free subscription to delete their account ([#4489](https://github.com/AzzappApp/azzapp/pull/4489))
* **fix:**  - **android:** [#4344](https://github.com/AzzappApp/azzapp/pull/4344) get correctly sizes on android ([#4488](https://github.com/AzzappApp/azzapp/pull/4488))
* **feat:**  - 🎸 use cover background color on empty web modules ([#4482](https://github.com/AzzappApp/azzapp/pull/4482))
* **fix:**  - dependency of useMemo
* **fix:**  - 🐛 allow change name uppercase ([#4478](https://github.com/AzzappApp/azzapp/pull/4478))
* **fix:**  - **IOS:**  cover animation on media ([#4476](https://github.com/AzzappApp/azzapp/pull/4476))
* **fix:**  - don’t display azzappPro on welcome screen ([#4474](https://github.com/AzzappApp/azzapp/pull/4474))
* **fix:**  - **contactCard:** [#4344](https://github.com/AzzappApp/azzapp/pull/4344) issue on size recuperation on android ([#4353](https://github.com/AzzappApp/azzapp/pull/4353))
* **fix:**  - **android:** [#4426](https://github.com/AzzappApp/azzapp/pull/4426) handle content file for avatar ([#4464](https://github.com/AzzappApp/azzapp/pull/4464))
* **fix:**  - **CoverEditor:** hide tag selector in text modal
* **fix:**  - 🐛 select template on webcard template category change ([#4453](https://github.com/AzzappApp/azzapp/pull/4453))
* **fix:**  - **multiUser:** [#2294](https://github.com/AzzappApp/azzapp/pull/2294) manage subscription on ownership transfer ([#4407](https://github.com/AzzappApp/azzapp/pull/4407))
* **feat:**  - 🎸 add options to edit first/last/company name ([#4432](https://github.com/AzzappApp/azzapp/pull/4432))
* **fix:**  - add missing avatar & logo in media ([#4456](https://github.com/AzzappApp/azzapp/pull/4456))
* **fix:**  - remove webcredentials to solve password prompt issue
* **fix:**  - remove missed webcredentials
* **fix:**  - **IOS:** disable webcredentials
* **fix:**  - **authent:** [#4430](https://github.com/AzzappApp/azzapp/pull/4430) remove Form tag
* **fix:**  - **authent:** [#4430](https://github.com/AzzappApp/azzapp/pull/4430) replace useAnimatedKeyboard
* **fix:**  - **authent:** [#4430](https://github.com/AzzappApp/azzapp/pull/4430) try with autofocus
* **feat:**  - 🎸 load background color ([#4436](https://github.com/AzzappApp/azzapp/pull/4436))
* **feat:**  - prellad username based on data ([#4425](https://github.com/AzzappApp/azzapp/pull/4425))
* **fix:**  - **authent:** [#4430](https://github.com/AzzappApp/azzapp/pull/4430) try to manually dismiss the keyboard
* **fix:**  - SubscriptionApi - await transaction and add sentry report ([#4431](https://github.com/AzzappApp/azzapp/pull/4431))
* **feat:**  - 🎸 add background on cover template ([#4417](https://github.com/AzzappApp/azzapp/pull/4417))
* **fix:**  - **android:** [#4411](https://github.com/AzzappApp/azzapp/pull/4411) avoid overlap on videos ([#4424](https://github.com/AzzappApp/azzapp/pull/4424))
* **fix:**  - emialsigntaure - be sure the phone action is formatted as uri properly ([#4410](https://github.com/AzzappApp/azzapp/pull/4410))
* **fix:**  - emialsigntaure - be sure the phone action is formatted as uri properly ([#4406](https://github.com/AzzappApp/azzapp/pull/4406))
* **fix:**  - **android:** [#4385](https://github.com/AzzappApp/azzapp/pull/4385) use expo-image to display images in the app ([#4388](https://github.com/AzzappApp/azzapp/pull/4388))
* **fix:**  - **android:** [#4385](https://github.com/AzzappApp/azzapp/pull/4385) use expo-image to display images in the app ([#4388](https://github.com/AzzappApp/azzapp/pull/4388))
* **fix:**  - useDerivedValue instead memo for animation js thread issue ([#4377](https://github.com/AzzappApp/azzapp/pull/4377))
* **fix:**  - 🐛 ensure selection frame size ([#4387](https://github.com/AzzappApp/azzapp/pull/4387))
* **fix:**  - 🐛 also hide preview comment when disabled ([#4380](https://github.com/AzzappApp/azzapp/pull/4380))
* **feat:**  - use free beta logo on home screen ([#4382](https://github.com/AzzappApp/azzapp/pull/4382))
* **feat:**  - add replica configuration ([#4379](https://github.com/AzzappApp/azzapp/pull/4379))
* **fix:**  - fix typo ([#4378](https://github.com/AzzappApp/azzapp/pull/4378))
* **fix:**  - contact card counter mutation ([#4375](https://github.com/AzzappApp/azzapp/pull/4375))
* **build:**  - remove expo update from iOS build
* **build:**  - remove expo update from iOS build
* **fix:**  - revenue stating identifier ([#4370](https://github.com/AzzappApp/azzapp/pull/4370))
* **fix:**  - revenue stating identifier ([#4370](https://github.com/AzzappApp/azzapp/pull/4370))
* **fix:**  - 🐛 clean preview style ([#4369](https://github.com/AzzappApp/azzapp/pull/4369))
* **feat:**  - 🎸 send notification to target user on transfer request ([#4346](https://github.com/AzzappApp/azzapp/pull/4346))
* **feat:**  - 🎸 disable save button when cover was not edited ([#4361](https://github.com/AzzappApp/azzapp/pull/4361))
* **fix:**  - 🐛 don't show scratch template with selected tag ([#4362](https://github.com/AzzappApp/azzapp/pull/4362))
* **fix:**  - **BackOffice:** remove remanent of old system
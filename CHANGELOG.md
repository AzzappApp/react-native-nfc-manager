## 0.5.2-canary.45

* **fix:**  - 🐛 correctly save common information
* **fix:**  - new webcard navigation param (id was not properly pass) ([#1972](https://github.com/AzzappApp/azzapp/pull/1972))
* **fix:**  - **webCard:** [#1926](https://github.com/AzzappApp/azzapp/pull/1926) put in common web & mobile social links configura… ([#1961](https://github.com/AzzappApp/azzapp/pull/1961))
* **feat:**  - 🎸 revalidate pages for posts on cover save
* **fix:**  - typo
* **fix:**  - remove unecessary groupBy
* **fix:**  - simplify followers/followings request. ProfileTable out of the scope
* **fix:**  - **post:** [#1676](https://github.com/AzzappApp/azzapp/pull/1676) update `Post I liked` list on like
* **fix:**  - **account:** [#1755](https://github.com/AzzappApp/azzapp/pull/1755) change error message everywhere
* **fix:**  - **webcard:** [#1523](https://github.com/AzzappApp/azzapp/pull/1523) wrong preview height on desktop
* **fix:**  - **modules:** [#1745](https://github.com/AzzappApp/azzapp/pull/1745) svg backgrounds with repeat are mixed
* **fix:**  - **post:** [#1822](https://github.com/AzzappApp/azzapp/pull/1822) separate allowLikes & allowComments to avoid side effects on fast clicking
* **fix:**  - 🐛 only allow owner to access webcard parameter ([#1959](https://github.com/AzzappApp/azzapp/pull/1959))
* **fix:**  - **home:** [#1762](https://github.com/AzzappApp/azzapp/pull/1762) wrong case in contactCard field ([#1946](https://github.com/AzzappApp/azzapp/pull/1946))
* **feat:**  - **media:** [#1080](https://github.com/AzzappApp/azzapp/pull/1080) filter suggested webcards
* **feat:**  - add bunch of color luts
* **fix:**  - 🐛 soft redirect to username lowercase ([#1925](https://github.com/AzzappApp/azzapp/pull/1925))
* **fix:**  - 🐛 add revalidation for post page on publish webcard ([#1927](https://github.com/AzzappApp/azzapp/pull/1927))
* **fix:**  - 🐛 use default activity when creating webcard ([#1922](https://github.com/AzzappApp/azzapp/pull/1922))
* **ui:**  - [#1767](https://github.com/AzzappApp/azzapp/pull/1767) center preview/hide icon
* **tests:**  - add unit tests on contact card + multi user
* **fix:**  - add missing address label
* **fix:**  - missing social profiles
* **fix:**  - test
* **fix:**  - unit test
* **fix:**  - reduce qr code size
* **fix:**  - **Media:** [#1790](https://github.com/AzzappApp/azzapp/pull/1790) media screen is not updated when actor is changed ([#1889](https://github.com/AzzappApp/azzapp/pull/1889))
* **fix:**  - **webCard:** [#1834](https://github.com/AzzappApp/azzapp/pull/1834) separate font size & spacing sliders
* **fix:**  - **posts:** [#1822](https://github.com/AzzappApp/azzapp/pull/1822) case with fast tapping on allow
* **ui:**  - **ContactCard:** [#1703](https://github.com/AzzappApp/azzapp/pull/1703) Contact Card with capital letters
* **fix:**  - update schema
* **fix:**  - **webCard:** [#1788](https://github.com/AzzappApp/azzapp/pull/1788) use isPrivate field from webCard
* **fix:**  - **contactCard:** [#1668](https://github.com/AzzappApp/azzapp/pull/1668) align text to the left on contact card form
* **fix:**  - **contactCard:** [#1720](https://github.com/AzzappApp/azzapp/pull/1720) protocol is needed in vcard to be seen as whole url
* **fix:**  - **post:** [#1794](https://github.com/AzzappApp/azzapp/pull/1794) don’t play video when screen isn’t focused
* **fix:**  - test
* **fix:**  - birthday may be removed without editing it
* **fix:**  - **contactCard:** [#1326](https://github.com/AzzappApp/azzapp/pull/1326) add date picker for birthday
* **fix:**  - unit test
* **fix:**  - **signup:** [#1755](https://github.com/AzzappApp/azzapp/pull/1755) precise that you can type at most 32 characters
* **fix:**  - **webCard:** [#1791](https://github.com/AzzappApp/azzapp/pull/1791) update followers list when we open the screen
* **fix:**  - **webCard:** [#1783](https://github.com/AzzappApp/azzapp/pull/1783) keep chosen aspect ratio in image picker
* **fix:**  - **webCard:** [#1785](https://github.com/AzzappApp/azzapp/pull/1785) swap colors to see correct one in border edition
* **fix:**  - **webCard:** [#1717](https://github.com/AzzappApp/azzapp/pull/1717) case when we re-add same color + remove current used color
* **fix:**  - **webCard:** [#1786](https://github.com/AzzappApp/azzapp/pull/1786) missing top/bottom labels
* **fix:**  - **webCard:** [#1782](https://github.com/AzzappApp/azzapp/pull/1782) limit number of shown digits in sliders
* **fix:**  - **webCard:** [#1447](https://github.com/AzzappApp/azzapp/pull/1447) cancel confirmation when tapping outside bottom sheet
* **fix:**  - types
* **fix:**  - **webCard:** [#1518](https://github.com/AzzappApp/azzapp/pull/1518) flip card when author is pressed
* **fix:**  - **webCard:** [#1738](https://github.com/AzzappApp/azzapp/pull/1738) border overlap content
* **fix:**  - **webCard:** [#1647](https://github.com/AzzappApp/azzapp/pull/1647) add different placeholders
* **fix:**  - **webCard:** [#1461](https://github.com/AzzappApp/azzapp/pull/1461) add placeholder for website
* **fix:**  - **webCard:** [#1737](https://github.com/AzzappApp/azzapp/pull/1737) show selected tryptich
* **fix:**  - **webCard:** [#1723](https://github.com/AzzappApp/azzapp/pull/1723) wrong color in dark mode for bullet separator
* **fix:**  - **webCard:** [#1756](https://github.com/AzzappApp/azzapp/pull/1756) remove background opacity transition
* **perf:**  - **webCard:** [#1773](https://github.com/AzzappApp/azzapp/pull/1773) debounce color change to fix laggy color chooser
* **fix:**  - **cover:** [#1805](https://github.com/AzzappApp/azzapp/pull/1805) don’t apply mask when segmentation is not enabled
* **fix:**  - **webCard:** [#1672](https://github.com/AzzappApp/azzapp/pull/1672) wrong font size on webcard color picker
* **fix:**  - clear error on submit
* **fix:**  - update error handler change username
* **feat:**  - multi user detail ([#1837](https://github.com/AzzappApp/azzapp/pull/1837))
* **fix:**  - 🐛 use working revalidatePage ([#1886](https://github.com/AzzappApp/azzapp/pull/1886))
* **fix:**  - clear error message after typing new phone number
* **fix:**  - renaming request
* **fix:**  - simplify
* **fix:**  - completion
* **followup:**  - multi user refactor
* **feat:**  - implement About Screen (waiting more spec)
* **fix:**  - **account:** [#1798](https://github.com/AzzappApp/azzapp/pull/1798) reset password form on opening bottom sheet
* **feat:**  - improve matcher (checked with logs)
* **fix:**  - **cover:** [#1765](https://github.com/AzzappApp/azzapp/pull/1765) change border color on dark mode
* **ui:**  - enhance borders with borderCurve
* **feat:**  - implement initial openGraph metadata
* **fix:**  - **post:** [#1804](https://github.com/AzzappApp/azzapp/pull/1804) add singular version of likes ([#1873](https://github.com/AzzappApp/azzapp/pull/1873))
* **build:**  - fix podfile.lock
* **build:**  - rollback upgrade of reanimated
* **build:**  - remove version set of nodejs
* **build:**  - fix yarn.lock
* **build:**  - upgrade image for ios buid
* **build:**  - try to force node-gyp
* **fix:**  - recomandedWebCards types ([#1866](https://github.com/AzzappApp/azzapp/pull/1866))
* **fix:**  - **webCard:** [#1832](https://github.com/AzzappApp/azzapp/pull/1832) rotate suggestions ([#1859](https://github.com/AzzappApp/azzapp/pull/1859))
* **fix:**  - **media:** [#1850](https://github.com/AzzappApp/azzapp/pull/1850) issue on select distinct ([#1862](https://github.com/AzzappApp/azzapp/pull/1862))
* **Fix:**  - fix and improvement after rework ([#1860](https://github.com/AzzappApp/azzapp/pull/1860))
* **fix:**  - **webCard:** [#1831](https://github.com/AzzappApp/azzapp/pull/1831) sort by label ([#1861](https://github.com/AzzappApp/azzapp/pull/1861))
* **fix:**  - Bug-20231020-2 - Browser_view - in post_view comment author "Nam… ([#1828](https://github.com/AzzappApp/azzapp/pull/1828))
* **fix:**  - Bug-20230624-11 - Account_Details - username field [#563](https://github.com/AzzappApp/azzapp/pull/563)
* **feat:**  - Webcard Parameters && Redirection ([#1766](https://github.com/AzzappApp/azzapp/pull/1766))
* **feat:**  - Add optional label on social link to handle company rename ....
* **feat:**  - allow copy paste of social link with mask
* **fix:**  - dont return undefined url
* **fix:**  - postscreen should not return null (in case of deeplinking to post with wrong id or error fetching) ([#1820](https://github.com/AzzappApp/azzapp/pull/1820))
* **fix:**  - **ContactCard:** scan with closed application
* **build:**  - yarn.lock
* **fix:**  - **ContactCard:** Compress contact card to avoid too long URL ([#1739](https://github.com/AzzappApp/azzapp/pull/1739))
* **feat:**  - add date info on stat chart ([#1699](https://github.com/AzzappApp/azzapp/pull/1699))
* **fix:**  - import table for drizzle command ([#1728](https://github.com/AzzappApp/azzapp/pull/1728))
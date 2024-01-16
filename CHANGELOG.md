## 0.5.2-canary.152

* **docs:**  - remove fastlane configuration
* **build:**  - create file if missing
* **build:**  - query-map has been moved
* **build:**  - query-map has been moved
* **fix:**  - 🐛 correctly defines which role access features ([#2299](https://github.com/AzzappApp/azzapp/pull/2299))
* **fix:**  - 🐛 deny access to multi & parameters before invite ([#2310](https://github.com/AzzappApp/azzapp/pull/2310))
* **fix:**  - **contactCard:** [#2229](https://github.com/AzzappApp/azzapp/pull/2229) missing common infos for urls and socials ([#2302](https://github.com/AzzappApp/azzapp/pull/2302))
* **feat:**  - 🎸 add transfer ownership ([#2293](https://github.com/AzzappApp/azzapp/pull/2293))
* **fix:**  - **contactCard:** [#2238](https://github.com/AzzappApp/azzapp/pull/2238) update azzapp label ([#2289](https://github.com/AzzappApp/azzapp/pull/2289))
* **fix:**  - **WebCardEdition:** recompute scroll height after element added ([#2290](https://github.com/AzzappApp/azzapp/pull/2290))
* **fix:**  - **router:** [#1741](https://github.com/AzzappApp/azzapp/pull/1741) manage unauthenticated case on deeplink ([#2273](https://github.com/AzzappApp/azzapp/pull/2273))
* **fix:**  - **CoverEdition:** invalid loading state in custom edition ([#2287](https://github.com/AzzappApp/azzapp/pull/2287))
* **fix:**  - **CoverEdition:** properly handle crop parameters on demo media ([#2286](https://github.com/AzzappApp/azzapp/pull/2286))
* **fix:**  - **multiUser:** [#2232](https://github.com/AzzappApp/azzapp/pull/2232) update cache when multi user is removed ([#2275](https://github.com/AzzappApp/azzapp/pull/2275))
* **fix:**  - **cover:** [#2264](https://github.com/AzzappApp/azzapp/pull/2264) properly fix cache issue on cover api ([#2284](https://github.com/AzzappApp/azzapp/pull/2284))
* **fix:**  - **contactCard:** [#2238](https://github.com/AzzappApp/azzapp/pull/2238) adding type= to have the label intrepreted ([#2283](https://github.com/AzzappApp/azzapp/pull/2283))
* **fix:**  - **home:** [#2237](https://github.com/AzzappApp/azzapp/pull/2237) wrong update of carousel on webcard creation ([#2281](https://github.com/AzzappApp/azzapp/pull/2281))
* **fix:**  - **contactCard:** [#2250](https://github.com/AzzappApp/azzapp/pull/2250) make camera preview bigger ([#2278](https://github.com/AzzappApp/azzapp/pull/2278))
* **fix:**  - animated foreground are not supported ([#2276](https://github.com/AzzappApp/azzapp/pull/2276))
* **fix:**  - **multiUser:** [#2214](https://github.com/AzzappApp/azzapp/pull/2214) remove arrow on disabled + check that admin user can’t try to update owner role ([#2268](https://github.com/AzzappApp/azzapp/pull/2268))
* **fix:**  - **cover:** [#2264](https://github.com/AzzappApp/azzapp/pull/2264) missing styles in cover text + revalidate on change ([#2266](https://github.com/AzzappApp/azzapp/pull/2266))
* **fix:**  - 🐛 don't use a default birthday on multi-user invite ([#2267](https://github.com/AzzappApp/azzapp/pull/2267))
* **test:**  - **modules:** [#2147](https://github.com/AzzappApp/azzapp/pull/2147) try to change classNames call ([#2260](https://github.com/AzzappApp/azzapp/pull/2260))
* **fix:**  - **cover:** [#2168](https://github.com/AzzappApp/azzapp/pull/2168) issue on cover without title/subtitle on mobile and… ([#2251](https://github.com/AzzappApp/azzapp/pull/2251))
* **fix:**  - wrong url generated when no foreground is set ([#2243](https://github.com/AzzappApp/azzapp/pull/2243))
* **fix:**  - **home:** [#2142](https://github.com/AzzappApp/azzapp/pull/2142) disable profile link on new webcard ([#2253](https://github.com/AzzappApp/azzapp/pull/2253))
* **fix:**  - **webCard:** [#2191](https://github.com/AzzappApp/azzapp/pull/2191) check role on changing webCard template ([#2254](https://github.com/AzzappApp/azzapp/pull/2254))
* **fix:**  - **cover:** [#2223](https://github.com/AzzappApp/azzapp/pull/2223) break word to wrap content in cover ([#2252](https://github.com/AzzappApp/azzapp/pull/2252))
* **fix:**  - **multiUser:** [#2214](https://github.com/AzzappApp/azzapp/pull/2214) display owner value + disable field when user is current one ([#2255](https://github.com/AzzappApp/azzapp/pull/2255))
* **style:**  - [#2189](https://github.com/AzzappApp/azzapp/pull/2189) adapt sliders in dark mode ([#2256](https://github.com/AzzappApp/azzapp/pull/2256))
* **fix:**  - **cover:** [#2051](https://github.com/AzzappApp/azzapp/pull/2051) background is missing in cover ([#2231](https://github.com/AzzappApp/azzapp/pull/2231))
* **fix:**  - 🐛 only display account details for owners ([#2248](https://github.com/AzzappApp/azzapp/pull/2248))
* **fix:**  - block action on post list if unpublishd web (with deepLinking) ([#2233](https://github.com/AzzappApp/azzapp/pull/2233))
* **fix:**  - **cover:** [#2225](https://github.com/AzzappApp/azzapp/pull/2225) clear optimisticUpdate on complete ([#2242](https://github.com/AzzappApp/azzapp/pull/2242))
* **fix:**  - [#2210](https://github.com/AzzappApp/azzapp/pull/2210) enhance sentry configuration on web ([#2234](https://github.com/AzzappApp/azzapp/pull/2234))
* **fix:**  - profileRole appeears to be undefined ([#2236](https://github.com/AzzappApp/azzapp/pull/2236))
* **build:**  - upgrade yoga server ([#2195](https://github.com/AzzappApp/azzapp/pull/2195))
* **feat:**  - Shake and share ([#2226](https://github.com/AzzappApp/azzapp/pull/2226))
* **fix:**  - **post:** [#2097](https://github.com/AzzappApp/azzapp/pull/2097) wrong count update on error ([#2221](https://github.com/AzzappApp/azzapp/pull/2221))
* **fix:**  - **account:** [#1722](https://github.com/AzzappApp/azzapp/pull/1722) don’t submit form on end editing confirm password ([#2220](https://github.com/AzzappApp/azzapp/pull/2220))
* **fix:**  - **cover:** [#2200](https://github.com/AzzappApp/azzapp/pull/2200) improve text animation on web to look similar to native ([#2218](https://github.com/AzzappApp/azzapp/pull/2218))
* **fix:**  - **multiUser:** [#2178](https://github.com/AzzappApp/azzapp/pull/2178) avoid multiple click on delete ([#2219](https://github.com/AzzappApp/azzapp/pull/2219))
* **fix:**  - **cover:** [#2032](https://github.com/AzzappApp/azzapp/pull/2032) add missing fonts in cover image generation ([#2216](https://github.com/AzzappApp/azzapp/pull/2216))
* **fix:**  - 🐛 properly slide to completion on home contact card ([#2202](https://github.com/AzzappApp/azzapp/pull/2202))
* **fix:**  - don't use a null webcardId for plural env ([#2227](https://github.com/AzzappApp/azzapp/pull/2227))
* **fix:**  - 🐛 hide toast when action is taken on webcard builder ([#2212](https://github.com/AzzappApp/azzapp/pull/2212))
* **fix:**  - **multiUser:** add title birthday on contact card filed form ([#2215](https://github.com/AzzappApp/azzapp/pull/2215))
* **fix:**  - **post:** [#2097](https://github.com/AzzappApp/azzapp/pull/2097) prevent users from commenting or liking posts of unpublished webcards ([#2181](https://github.com/AzzappApp/azzapp/pull/2181))
* **fix:**  - hide post action bar when opening a post through Deeplink with unpublished webcard ([#2203](https://github.com/AzzappApp/azzapp/pull/2203))
* **fix:**  - allow to delete one contact element (phone, email) if both are present ([#2209](https://github.com/AzzappApp/azzapp/pull/2209))
* **fix:**  - **BrowserView:** cache
* **fix:**  - avoid instable state in  toggle publish switch using optimisticResponse ([#2207](https://github.com/AzzappApp/azzapp/pull/2207))
* **fix:**  - remove expired redirection when checking is username is avaialbe ([#2190](https://github.com/AzzappApp/azzapp/pull/2190))
* **fix:**  - using profileRole on profile to show multiUser menu ([#2196](https://github.com/AzzappApp/azzapp/pull/2196))
* **fix:**  - hide common information is  multiUser disabled ([#2194](https://github.com/AzzappApp/azzapp/pull/2194))
* **fix:**  - **post:** [#658](https://github.com/AzzappApp/azzapp/pull/658) add sms and mail options ([#2192](https://github.com/AzzappApp/azzapp/pull/2192))
* **fix:**  - **multiUser:** [#1987](https://github.com/AzzappApp/azzapp/pull/1987) missed option in post ([#2180](https://github.com/AzzappApp/azzapp/pull/2180))
* **fix:**  - **authent:** [#1722](https://github.com/AzzappApp/azzapp/pull/1722) avoid double reset password submission ([#2182](https://github.com/AzzappApp/azzapp/pull/2182))
* **fix:**  - **account:** [#2120](https://github.com/AzzappApp/azzapp/pull/2120) don’t submit on done ([#2183](https://github.com/AzzappApp/azzapp/pull/2183))
* **fix:**  - **account:** [#2119](https://github.com/AzzappApp/azzapp/pull/2119) missing toast confirmation after updating password ([#2185](https://github.com/AzzappApp/azzapp/pull/2185))
* **fix:**  - **webcard:** improve behaviour with footer  when switching edition mode ([#2167](https://github.com/AzzappApp/azzapp/pull/2167))
* **fix:**  - change username invitation label faster (at half transition) ([#2184](https://github.com/AzzappApp/azzapp/pull/2184))
* **fix:**  - avoid unstable state when calculated index is over the max  and a decimal after EndMomentum is called ([#2179](https://github.com/AzzappApp/azzapp/pull/2179))
* **fix:**  - **WebCardEdition:** remove Webcard module preview ([#2160](https://github.com/AzzappApp/azzapp/pull/2160))
* **fix:**  - **media:** [#1983](https://github.com/AzzappApp/azzapp/pull/1983) don’t suggest same webCard ([#2176](https://github.com/AzzappApp/azzapp/pull/2176))
* **fix:**  - fix empty text block renderer ine desktop preview ([#2173](https://github.com/AzzappApp/azzapp/pull/2173))
* **fix:**  - **multiUser:** [#2088](https://github.com/AzzappApp/azzapp/pull/2088) force logout when user is using a webcard he has no more access ([#2172](https://github.com/AzzappApp/azzapp/pull/2172))
* **fix:**  - crash when leaving app for permission and going back on app. (update package to match RN 0.73.*) ([#2157](https://github.com/AzzappApp/azzapp/pull/2157))
* **fix:**  - **webCard:** [#2028](https://github.com/AzzappApp/azzapp/pull/2028) background resize mode was always set to cover ([#2161](https://github.com/AzzappApp/azzapp/pull/2161))
* **fix:**  - **multiUser:** [#2090](https://github.com/AzzappApp/azzapp/pull/2090) filter social profiles to known ones ([#2155](https://github.com/AzzappApp/azzapp/pull/2155))
* **fix:**  - **multiUser:** [#1870](https://github.com/AzzappApp/azzapp/pull/1870) implement deletion on avatar ([#2150](https://github.com/AzzappApp/azzapp/pull/2150))
* **fix:**  - do not include id (conflict with input mutation params) ([#2158](https://github.com/AzzappApp/azzapp/pull/2158))
* **fix:**  - **webCard:** [#2027](https://github.com/AzzappApp/azzapp/pull/2027) background overlaps content ([#2153](https://github.com/AzzappApp/azzapp/pull/2153))
* **fix:**  - **multiUser:** [#2095](https://github.com/AzzappApp/azzapp/pull/2095) add common infos on add user modal as well ([#2148](https://github.com/AzzappApp/azzapp/pull/2148))
* **fix:**  - **multiUser:** [#2022](https://github.com/AzzappApp/azzapp/pull/2022) you can’t remove owner ([#2145](https://github.com/AzzappApp/azzapp/pull/2145))
* **fix:**  - **multiUser:** [#2047](https://github.com/AzzappApp/azzapp/pull/2047) missing avatar in multi-user list ([#2144](https://github.com/AzzappApp/azzapp/pull/2144))
* **fix:**  - **WebcardEdition:** refactor the animation system ([#2139](https://github.com/AzzappApp/azzapp/pull/2139))
* **fix:**  - **cover:** [#2125](https://github.com/AzzappApp/azzapp/pull/2125) sync lottie with video and hacks for safari support ([#2137](https://github.com/AzzappApp/azzapp/pull/2137))
* **fix:**  - **post:** [#1987](https://github.com/AzzappApp/azzapp/pull/1987) prevent users without editor role to edit posts ([#2131](https://github.com/AzzappApp/azzapp/pull/2131))
* **fix:**  - **webcard:** [#2030](https://github.com/AzzappApp/azzapp/pull/2030) break big words ([#2138](https://github.com/AzzappApp/azzapp/pull/2138))
* **fix:**  - hide the publish web card for not owner ([#2136](https://github.com/AzzappApp/azzapp/pull/2136))
* **fix:**  - **multiUser:** [#2095](https://github.com/AzzappApp/azzapp/pull/2095) missing common infos in user details modal ([#2127](https://github.com/AzzappApp/azzapp/pull/2127))
* **fix:**  - **home:** [#1953](https://github.com/AzzappApp/azzapp/pull/1953) don’t display contact card on invitations ([#2135](https://github.com/AzzappApp/azzapp/pull/2135))
* **fix:**  - **media:** [#1953](https://github.com/AzzappApp/azzapp/pull/1953) trim search string ([#2134](https://github.com/AzzappApp/azzapp/pull/2134))
* **fix:**  - **multiUser:** [#2091](https://github.com/AzzappApp/azzapp/pull/2091) add loading indicator on saving ([#2128](https://github.com/AzzappApp/azzapp/pull/2128))
* **fix:**  - replace the close button with arrow left ([#2133](https://github.com/AzzappApp/azzapp/pull/2133))
* **fix:**  - don't self increment webcardView (wrong comparison profileId and webcardId) ([#2129](https://github.com/AzzappApp/azzapp/pull/2129))
* **fix:**  - display of stats/info with one Card  could crash when sliding from new webcard ([#2130](https://github.com/AzzappApp/azzapp/pull/2130))
* **fix:**  - **ImagePicker:** correctly compute cropData for forced aspect ratio ([#2123](https://github.com/AzzappApp/azzapp/pull/2123))
* **fix:**  - **CoverEdition:** on end reached dispatched too late ([#2126](https://github.com/AzzappApp/azzapp/pull/2126))
* **fix:**  - **home:** [#2108](https://github.com/AzzappApp/azzapp/pull/2108) issue on returned date on server that are unexpected on client ([#2122](https://github.com/AzzappApp/azzapp/pull/2122))
* **fix:**  - wrong animation names + small fixes ([#2124](https://github.com/AzzappApp/azzapp/pull/2124))
* **fix:**  - **home:** [#2107](https://github.com/AzzappApp/azzapp/pull/2107) adapt bottom menu on home on new profile case ([#2117](https://github.com/AzzappApp/azzapp/pull/2117))
* **fix:**  - **CoverEdition:** prevent rerendering of media when paused/unpaused ([#2116](https://github.com/AzzappApp/azzapp/pull/2116))
* **feat:**  - add text animations ([#2112](https://github.com/AzzappApp/azzapp/pull/2112))
* **fix:**  - **account:** [#2110](https://github.com/AzzappApp/azzapp/pull/2110) remove webcard from account details screen header ([#2115](https://github.com/AzzappApp/azzapp/pull/2115))
* **build:**  - remove patch for next-cloudinary ([#2113](https://github.com/AzzappApp/azzapp/pull/2113))
* **fix:**  - **CoverEdition:** don't apply mask on demo media ([#2114](https://github.com/AzzappApp/azzapp/pull/2114))
* **fix:**  - **CoverEdition:** Easing of animations ([#2111](https://github.com/AzzappApp/azzapp/pull/2111))
* **feat:**  - **CoverEdition:** new loading/error indicator system ([#2100](https://github.com/AzzappApp/azzapp/pull/2100))
* **feat:**  - add lottie animation on cover on web ([#2094](https://github.com/AzzappApp/azzapp/pull/2094))
* **fix:**  - webcard scan view counter ([#2106](https://github.com/AzzappApp/azzapp/pull/2106))
* **fix:**  - add action on multiuser header right element cover ([#2092](https://github.com/AzzappApp/azzapp/pull/2092))
* **fix:**  - dont redirect if the card cas never publish ([#2105](https://github.com/AzzappApp/azzapp/pull/2105))
* **fix:**  - **change username:** if never publish, the username can be changed wiuthtout control
* **fix:**  - change default value of env
* **fix:**  - avoid double press on take photo ([#2084](https://github.com/AzzappApp/azzapp/pull/2084))
* **fix:**  - 🐛 use manual entry ([#2058](https://github.com/AzzappApp/azzapp/pull/2058))
* **fix:**  - 🐛 restore behavior for avoidingKeyboardScroll on modal ([#2081](https://github.com/AzzappApp/azzapp/pull/2081))
* **fix:**  - mutiUserdetailModal was using a hardcoded role value ([#2089](https://github.com/AzzappApp/azzapp/pull/2089))
* **perf:**  - web - enhance image / video sizes ([#2074](https://github.com/AzzappApp/azzapp/pull/2074))
* **build:**  - update expo version ([#2080](https://github.com/AzzappApp/azzapp/pull/2080))
* **fix:**  - multi user dark mode && graph ([#2066](https://github.com/AzzappApp/azzapp/pull/2066))
* **fix:**  - 🐛 add missing adress in multi user ([#2067](https://github.com/AzzappApp/azzapp/pull/2067))
* **fix:**  - WebView and contact card scan counter  ([#2069](https://github.com/AzzappApp/azzapp/pull/2069))
* **fix:**  - 🐛 don't display option for manual entry ([#2055](https://github.com/AzzappApp/azzapp/pull/2055))
* **fix:**  - **CoverEdition:** saving current cover when media visible
* **fix:**  - **CoverEdition:** Media display and background animation ([#2065](https://github.com/AzzappApp/azzapp/pull/2065))
* **fix:**  - **CoverEdition:** no reset at the end of suggested media list during loading ([#2054](https://github.com/AzzappApp/azzapp/pull/2054))
* **fix:**  - **CoverEdition:** display current cover when media is hidden ([#2052](https://github.com/AzzappApp/azzapp/pull/2052))
* **fix:**  - improve reaction (avoiding error while spamming) ([#2049](https://github.com/AzzappApp/azzapp/pull/2049))
* **build:**  - try to force Hermes-engine version
* **feat:**  - **CoverEdition:** uniform UI for all list (medias, animations, etc ...) ([#2048](https://github.com/AzzappApp/azzapp/pull/2048))
* **build:**  - remove useless display name
* **build:**  - update for jdk 17 and rn 0.73
* **fix:**  - **webCard:** [#1692](https://github.com/AzzappApp/azzapp/pull/1692) display cover everywhere ([#2021](https://github.com/AzzappApp/azzapp/pull/2021))
* **fix:**  - webcardparameter single source of truth for change date ([#2042](https://github.com/AzzappApp/azzapp/pull/2042))
* **feat:**  - 🎸 add button to remove avatar ([#2045](https://github.com/AzzappApp/azzapp/pull/2045))
* **fix:**  - **signup:** [#1982](https://github.com/AzzappApp/azzapp/pull/1982) missing profileRole while signin through signup screen ([#2039](https://github.com/AzzappApp/azzapp/pull/2039))
* **fix:**  - **contactCard:** [#1853](https://github.com/AzzappApp/azzapp/pull/1853) adapt camera buttons position ([#2037](https://github.com/AzzappApp/azzapp/pull/2037))
* **fix:**  - **post:** [#1679](https://github.com/AzzappApp/azzapp/pull/1679) make username clickable ([#2034](https://github.com/AzzappApp/azzapp/pull/2034))
* **fix:**  - **post:** [#1894](https://github.com/AzzappApp/azzapp/pull/1894) display cover in author cartouche ([#2035](https://github.com/AzzappApp/azzapp/pull/2035))
* **fix:**  - **webcard:** [#1734](https://github.com/AzzappApp/azzapp/pull/1734) replace 🐦 with 𝕏 ([#2033](https://github.com/AzzappApp/azzapp/pull/2033))
* **feat:**  - **CoverEdition:** Add media rotate animation
* **feat:**  - **Backoffice:** cover template animation form fields
* **fix:**  - Post I Liked screen behavior and mutation ([#2019](https://github.com/AzzappApp/azzapp/pull/2019))
* **fix:**  - **post:** [#1630](https://github.com/AzzappApp/azzapp/pull/1630) load posts on scroll ([#2031](https://github.com/AzzappApp/azzapp/pull/2031))
* **feat:**  - **Cover:** animations ([#2029](https://github.com/AzzappApp/azzapp/pull/2029))
* **fix:**  - 🐛 display specific messsage when inviting user ([#1998](https://github.com/AzzappApp/azzapp/pull/1998))
* **fix:**  - 🐛 don't reset contact card on invitation accepted ([#2024](https://github.com/AzzappApp/azzapp/pull/2024))
* **fix:**  - admin multi screen ([#2025](https://github.com/AzzappApp/azzapp/pull/2025))
* **fix:**  - show staticMedia if tint and bg color are white ([#2015](https://github.com/AzzappApp/azzapp/pull/2015))
* **feat:**  - remove user multi ([#1963](https://github.com/AzzappApp/azzapp/pull/1963))
* **fix:**  - **post:** [#1679](https://github.com/AzzappApp/azzapp/pull/1679) set correct number of posts + set author clickable ([#2009](https://github.com/AzzappApp/azzapp/pull/2009))
* **fix:**  - **webCard:** [#1768](https://github.com/AzzappApp/azzapp/pull/1768) 🎨 wrong text padding on cover ([#2001](https://github.com/AzzappApp/azzapp/pull/2001))
* **fix:**  - **post:** [#1509](https://github.com/AzzappApp/azzapp/pull/1509) make cover of comment author clickable ([#2011](https://github.com/AzzappApp/azzapp/pull/2011))
* **fix:**  - **SocialLinks:** test website url with http and https to format the … ([#1956](https://github.com/AzzappApp/azzapp/pull/1956))
* **fix:**  - **post:** with small posts scroll bar is on the middle ([#2012](https://github.com/AzzappApp/azzapp/pull/2012))
* **fix:**  - avoid negativ value on like counter ([#2010](https://github.com/AzzappApp/azzapp/pull/2010))
* **fix:**  - refresh user list ([#2008](https://github.com/AzzappApp/azzapp/pull/2008))
* **feat:**  -  Mobile App > Add new font [#1949](https://github.com/AzzappApp/azzapp/pull/1949) && web ([#2006](https://github.com/AzzappApp/azzapp/pull/2006))
* **fix:**  - **home:** [#1762](https://github.com/AzzappApp/azzapp/pull/1762) increase total contact card scans ([#2000](https://github.com/AzzappApp/azzapp/pull/2000))
* **fix:**  - remove unused color on contact card ([#1994](https://github.com/AzzappApp/azzapp/pull/1994))
* **fix:**  - changeusername, fix the lastUpdateUsername handling ([#1989](https://github.com/AzzappApp/azzapp/pull/1989))
* **fix:**  - 🐛 do not display remove user button for current user ([#1988](https://github.com/AzzappApp/azzapp/pull/1988))
* **fix:**  - **post:** [#1521](https://github.com/AzzappApp/azzapp/pull/1521) make comments scrollable on desktop ([#1990](https://github.com/AzzappApp/azzapp/pull/1990))
* **fix:**  - configure eas env
* **fix:**  - **webcard builder:** disabled header buttons when showing colors ([#1979](https://github.com/AzzappApp/azzapp/pull/1979))
* **fix:**  - properly remove current webcard when loading a new template ([#1978](https://github.com/AzzappApp/azzapp/pull/1978))
* **fix:**  - saveCardStyle wrong param from before multi user ([#1976](https://github.com/AzzappApp/azzapp/pull/1976))
* **fix:**  - text measure with empty line containing \n ([#1974](https://github.com/AzzappApp/azzapp/pull/1974))
* **fix:**  - 🐛 sync multi user ui
* **feat:**  - add shadow on cover  in all result
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
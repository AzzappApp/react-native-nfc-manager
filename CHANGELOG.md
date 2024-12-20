## 1.5.4-canary.5

* **fix:**  - don’t read directly profile that may be missing on replica
* **fix:**  - try to read profile within transaction
* **fix:**  - add confirmation message when we choose a template but modules are already available ([#6457](https://github.com/AzzappApp/azzapp/pull/6457))
* **fix:**  - **Home:** freeze when stats scrolling
* **fix:**  - add validation on URL but also a red indicator on tool to find t… ([#6442](https://github.com/AzzappApp/azzapp/pull/6442))
* **fix:**  - replace dataloader with get query
* **fix:**  - lzString decoding algorithm ([#6451](https://github.com/AzzappApp/azzapp/pull/6451))
* **fix:**  - simplify get profileId value + get profileId value
* **fix:**  - 🐛 properly handle edit on android home contact card ([#6449](https://github.com/AzzappApp/azzapp/pull/6449))
* **fix:**  - **mediaPicker:** [#6428](https://github.com/AzzappApp/azzapp/pull/6428) put back patch on camera-roll ([#6448](https://github.com/AzzappApp/azzapp/pull/6448))
* **fix:**  - **Home:** fix ios freeze on HOME
* **fix:**  - **modules:** [#6441](https://github.com/AzzappApp/azzapp/pull/6441) rebuild path after local copy ([#6443](https://github.com/AzzappApp/azzapp/pull/6443))
* **fix:**  - **video:** [#6412](https://github.com/AzzappApp/azzapp/pull/6412) thumbnail is strechted during webcard closing ([#6445](https://github.com/AzzappApp/azzapp/pull/6445))
* **fix:**  - **post:** [#6428](https://github.com/AzzappApp/azzapp/pull/6428) remove # from uri ([#6440](https://github.com/AzzappApp/azzapp/pull/6440))
* **fix:**  - **modules:** [#6432](https://github.com/AzzappApp/azzapp/pull/6432) contentInset is not supported on android ([#6436](https://github.com/AzzappApp/azzapp/pull/6436))
* **fix:**  - 🐛 properly return filename ([#6439](https://github.com/AzzappApp/azzapp/pull/6439))
* **fix:**  - **modules:** check if subscription is needed before adding a new module ([#6427](https://github.com/AzzappApp/azzapp/pull/6427))
* **fix:**  - **modules:** [#6224](https://github.com/AzzappApp/azzapp/pull/6224) add videos in slideshow ([#6431](https://github.com/AzzappApp/azzapp/pull/6431))
* **fix:**  - **modules:** [#6429](https://github.com/AzzappApp/azzapp/pull/6429) incorrect file path on android ([#6435](https://github.com/AzzappApp/azzapp/pull/6435))
* **fix:**  - **webCard:** [#6422](https://github.com/AzzappApp/azzapp/pull/6422) no access to template list when not yet published ([#6433](https://github.com/AzzappApp/azzapp/pull/6433))
* **build:**  - update nextjs for compatibility with node 22
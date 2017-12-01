<a name="0.0.28"></a>
## 0.0.28 (2017-12-01)


### Bug Fixes

* Make sure we are working with a non shallow repo ([21997dd](https://github.com/rocjs/roc-repo/commit/21997dd))



<a name="0.0.27"></a>
## 0.0.27 (2017-11-28)


### Performance Improvements

* Reduce calls to `executeSync` in `getAutoScopes` ([8516455](https://github.com/rocjs/roc-repo/commit/8516455))



<a name="0.0.26"></a>
## 0.0.26 (2017-11-24)


### Bug Fixes

* Added --prerelease option to graph and bootstrap ([c723884](https://github.com/rocjs/roc-repo/commit/c723884))
* Ensure safe ignore-pattern ([d087a78](https://github.com/rocjs/roc-repo/commit/d087a78))
* Fix problem when projects don't have dependencies ([8f62726](https://github.com/rocjs/roc-repo/commit/8f62726))
* Lock version of prettier to not get format changes ([f293467](https://github.com/rocjs/roc-repo/commit/f293467))



<a name="0.0.25"></a>
## 0.0.25 (2017-10-03)


### Bug Fixes

* Bumped dependencies ([02d2291](https://github.com/rocjs/roc-plugin-repo/commit/02d2291))
* Fix issue when performing a prerelease ([2ea611e](https://github.com/rocjs/roc-plugin-repo/commit/2ea611e))
* Made it work better with revert commits ([46395f1](https://github.com/rocjs/roc-plugin-repo/commit/46395f1))
* Solved issue when doing collected releases ([3ad7bad](https://github.com/rocjs/roc-plugin-repo/commit/3ad7bad))



<a name="0.0.24"></a>
## 0.0.24 (2017-09-19)


### Bug Fixes

* Show what projects that will be released in auto ([e0e9887](https://github.com/rocjs/roc-plugin-repo/commit/e0e9887))
* Synced against our Git remote when doing a release ([4fd9274](https://github.com/rocjs/roc-plugin-repo/commit/4fd9274))



<a name="0.0.23"></a>
## 0.0.23 (2017-09-10)


### Bug Fixes

* Added info to graph command for no projects ([81e1bf7](https://github.com/rocjs/roc-plugin-repo/commit/81e1bf7))
* Create annotated tags in Git ([663d1d3](https://github.com/rocjs/roc-plugin-repo/commit/663d1d3))
* Solve possible race condition when doing a release ([c2716a0](https://github.com/rocjs/roc-plugin-repo/commit/c2716a0))



<a name="0.0.22"></a>
## 0.0.22 (2017-09-07)


### Bug Fixes

* Fix bug where git user would be undefined ([6df8aed](https://github.com/rocjs/roc-plugin-repo/commit/6df8aed))



<a name="0.0.21"></a>
## 0.0.21 (2017-09-07)


### Bug Fixes

* Fix issue with auto release on Travis ([46cc939](https://github.com/rocjs/roc-plugin-repo/commit/46cc939))



<a name="0.0.20"></a>
## 0.0.20 (2017-09-07)


### Bug Fixes

* Correctly generate changelogs when specifying from ([da54bcd](https://github.com/rocjs/roc-plugin-repo/commit/da54bcd))
* Display current version for status better ([5cf3e83](https://github.com/rocjs/roc-plugin-repo/commit/5cf3e83))
* Fix a problem when creating commits in release cmd ([480601b](https://github.com/rocjs/roc-plugin-repo/commit/480601b))
* Support merge commits in a better way for release ([8155828](https://github.com/rocjs/roc-plugin-repo/commit/8155828))
* Support Travis when doing automatic releases ([fbf4947](https://github.com/rocjs/roc-plugin-repo/commit/fbf4947))



<a name="0.0.19"></a>
## 0.0.19 (2017-09-04)


### Bug Fixes

* Do not use scope for release commits in non mono ([de747d0](https://github.com/rocjs/roc-plugin-repo/commit/de747d0))
* Support for an ALL, MULTI and * scope, for mono ([4c82e4b](https://github.com/rocjs/roc-plugin-repo/commit/4c82e4b))



<a name="0.0.18"></a>
## 0.0.18 (2017-09-01)


### Bug Fixes

* Fix issue with GitHub release for non monorepo ([3ba90c7](https://github.com/rocjs/roc-plugin-repo/commit/3ba90c7))
* Fix problem with GitHub releases when using --from ([e1a54d9](https://github.com/rocjs/roc-plugin-repo/commit/e1a54d9))
* Set Git commiter as well as author for release ([01f5e26](https://github.com/rocjs/roc-plugin-repo/commit/01f5e26))



<a name="0.0.17"></a>
## 0.0.17 (2017-09-01)


### Bug Fixes

* Solve issue when doing a release and using --from ([94ce68c](https://github.com/rocjs/roc-plugin-repo/commit/94ce68c))



<a name="0.0.16"></a>
## 0.0.16 (2017-09-01)


### Bug Fixes

* Use latest version of conventional-changelog ([f2dceec](https://github.com/rocjs/roc-plugin-repo/commit/f2dceec))



<a name="0.0.15"></a>
## 0.0.15 (2017-08-31)


### Bug Fixes

* Fix issue in bootstrap command related to linking ([f99dd35](https://github.com/rocjs/roc-plugin-repo/commit/f99dd35))
* Show in list command if a project is private ([6cfe9ca](https://github.com/rocjs/roc-plugin-repo/commit/6cfe9ca))



<a name="0.0.14"></a>
## 0.0.14 (2017-08-31)


### Bug Fixes

* Only show GitHub release text if we have one ([5b38a8b](https://github.com/rocjs/roc-plugin-repo/commit/5b38a8b))
* Possible to define Git author and disable hooks ([2139144](https://github.com/rocjs/roc-plugin-repo/commit/2139144))



<a name="0.0.13"></a>
## 0.0.13 (2017-08-30)


### Bug Fixes

* Fix problem with running test when releasing ([8d20099](https://github.com/rocjs/roc-plugin-repo/commit/8d20099))



<a name="0.0.12"></a>
## 0.0.12 (2017-08-30)


### Bug Fixes

* Use execa over execute in release for error info ([a791f24](https://github.com/rocjs/roc-plugin-repo/commit/a791f24))



<a name="0.0.11"></a>
## 0.0.11 (2017-08-30)


### Bug Fixes

* Only remove node_modules for monorepos ([c49f231](https://github.com/rocjs/roc-plugin-repo/commit/c49f231))



<a name="0.0.10"></a>
## 0.0.10 (2017-08-30)


### Bug Fixes

* Do GitHub release as prerelease if in prerelease ([cc22d39](https://github.com/rocjs/roc-plugin-repo/commit/cc22d39))
* Enforce NODE_ENV=test when running tests ([24deee0](https://github.com/rocjs/roc-plugin-repo/commit/24deee0))
* Remove unused dependency ([661fd48](https://github.com/rocjs/roc-plugin-repo/commit/661fd48))
* Support glob pattern in settings for mono ([72d9616](https://github.com/rocjs/roc-plugin-repo/commit/72d9616))
* Use NODE_ENV=production when building for release ([046df54](https://github.com/rocjs/roc-plugin-repo/commit/046df54))



<a name="0.0.9"></a>
## 0.0.9 (2017-08-28)


### Bug Fixes

* Improve concurrency flexibility ([bf676c4](https://github.com/rocjs/roc-plugin-repo/commit/bf676c4))
* Use Listr for "run" and enable concurrency support ([2ca6971](https://github.com/rocjs/roc-plugin-repo/commit/2ca6971))
* Use verbose renderer for Listr when running in CI ([27360c5](https://github.com/rocjs/roc-plugin-repo/commit/27360c5))



<a name="0.0.8"></a>
## 0.0.8 (2017-08-24)


### Bug Fixes

* Add check for repository field for GitHub releases ([f12dd68](https://github.com/rocjs/roc-plugin-repo/commit/f12dd68))
* Add from flag to status and release for start hash ([25eb2bb](https://github.com/rocjs/roc-plugin-repo/commit/25eb2bb))
* Add graph command, shows how projects are related ([151be26](https://github.com/rocjs/roc-plugin-repo/commit/151be26))
* Add new interactive mode when doing a release ([75e1351](https://github.com/rocjs/roc-plugin-repo/commit/75e1351))
* Add support for making prereleases of projects ([0fe421b](https://github.com/rocjs/roc-plugin-repo/commit/0fe421b))
* Add support for the revert type for commits ([39feca1](https://github.com/rocjs/roc-plugin-repo/commit/39feca1))
* Addressed issue generating status for non monorepo ([573f536](https://github.com/rocjs/roc-plugin-repo/commit/573f536))
* Better changelog generation for both repo types ([a3b95ff](https://github.com/rocjs/roc-plugin-repo/commit/a3b95ff))
* Display current version when listing projects ([c40ee81](https://github.com/rocjs/roc-plugin-repo/commit/c40ee81))
* Enabled support for creating GitHub releases ([193a2fc](https://github.com/rocjs/roc-plugin-repo/commit/193a2fc))
* Fix issue when generating status for some repos ([e635986](https://github.com/rocjs/roc-plugin-repo/commit/e635986))
* Ignore __mocks__ when building projects ([f984884](https://github.com/rocjs/roc-plugin-repo/commit/f984884))
* Improve bootstrap command, making it support npm[@5](https://github.com/5) ([00fa904](https://github.com/rocjs/roc-plugin-repo/commit/00fa904))
* Made it possible to force linking all projects ([34556e5](https://github.com/rocjs/roc-plugin-repo/commit/34556e5))



<a name="0.0.7"></a>
## 0.0.7 (2017-07-31)


### Bug Fixes

* **roc-plugin-repo:** Use default .eslintignore file ([6798f87](https://github.com/rocjs/roc-plugin-repo/commit/6798f87))



<a name="0.0.6"></a>
## 0.0.6 (2017-07-31)


### Bug Fixes

* **roc-plugin-repo:** Add missing dependency on babel-eslint ([5acbb0a](https://github.com/rocjs/roc-plugin-repo/commit/5acbb0a))



<a name="0.0.5"></a>
## 0.0.5 (2017-07-14)


### Bug Fixes

* **roc-plugin-repo:** Build projects before running the tests ([0c81055](https://github.com/rocjs/roc-plugin-repo/commit/0c81055))
* **roc-plugin-repo:** Ignore __snapshots__ when building projects ([c441e11](https://github.com/rocjs/roc-plugin-repo/commit/c441e11))



<a name="0.0.4"></a>
## 0.0.4 (2017-07-13)


### Bug Fixes

* **roc-plugin-repo:** Alias for starting build in watch mode, --w ([98ab034](https://github.com/rocjs/roc-plugin-repo/commit/98ab034))
* **roc-plugin-repo:** Correct bootstrap to work correctly with npm 5 ([d055f53](https://github.com/rocjs/roc-plugin-repo/commit/d055f53))
* **roc-plugin-repo:** Correct release command to correctly run tests ([1b39348](https://github.com/rocjs/roc-plugin-repo/commit/1b39348))



<a name="0.0.3"></a>
## 0.0.3 (2017-07-11)


### Bug Fixes

* **roc-plugin-repo:** registry when publishing is now per project ([88aa0aa](https://github.com/rocjs/roc-plugin-repo/commit/88aa0aa))



<a name="0.0.2"></a>
## 0.0.2 (2017-07-11)


### Bug Fixes

* **roc-plugin-repo:** add new command, exec, that runs cmds in projects ([eaca6ec](https://github.com/rocjs/roc-plugin-repo/commit/eaca6ec))
* **roc-plugin-repo:** better support for npm 5 when doing bootstrap ([12d9ef2](https://github.com/rocjs/roc-plugin-repo/commit/12d9ef2))
* **roc-plugin-repo:** bump version of babel-preset-env to latest ([e5c6822](https://github.com/rocjs/roc-plugin-repo/commit/e5c6822))
* **roc-plugin-repo:** fixed bug in test command ([f238549](https://github.com/rocjs/roc-plugin-repo/commit/f238549))
* **roc-plugin-repo:** fixed bug in unlink command ([e24ddd5](https://github.com/rocjs/roc-plugin-repo/commit/e24ddd5))
* **roc-plugin-repo:** support for passing config to babel-present-env ([ace750f](https://github.com/rocjs/roc-plugin-repo/commit/ace750f))



<a name="0.0.1"></a>
## 0.0.1 (2017-07-10)


### Bug Fixes

* **roc-plugin-repo:** Initial version ([9dde3db](https://github.com/rocjs/roc-plugin-repo/commit/9dde3db))




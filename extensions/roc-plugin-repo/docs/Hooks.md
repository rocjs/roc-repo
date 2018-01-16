# Hooks for `roc-plugin-repo`

## Hooks
* [roc](#roc)
  * [update-settings](#update-settings)
* [roc-plugin-repo](#roc-plugin-repo)
  * [babel-config](#babel-config)
  * [get-projects](#get-projects)
  * [release-after-build](#release-after-build)
  * [release-preconditions](#release-preconditions)
  * [run-script](#run-script)

## roc

### update-settings

Expected to return new settings that should be merged with the existing ones.

Makes it possible to modify the settings object before a command is started and after potential arguments from the command line and configuration file have been parsed. This is a good point to default to some value if no was given or modify something in the settings.

__Initial value:__ _Nothing_  
__Expected return value:__ `Object()`

#### Arguments

| Name        | Description                                                                  | Type       | Required | Can be empty |
| ----------- | ---------------------------------------------------------------------------- | ---------- | -------- | ------------ |
| getSettings | A function that returns the settings after the context has been initialized. | `Function` | No       |              |

## roc-plugin-repo

### babel-config

Used to create a Babel configuration to be used.

__Initial value:__ `{}`  
__Expected return value:__ `Object()`

#### Arguments

| Name   | Description                                           | Type     | Required | Can be empty |
| ------ | ----------------------------------------------------- | -------- | -------- | ------------ |
| target | The target, will by default be either "cjs" or "esm". | `String` | No       | Yes          |

### get-projects

Gets all projects.

__Initial value:__ _Nothing_  
__Expected return value:__ `Array(Object())`

### release-after-build

Extra tasks to do before releasing, after building.

__Initial value:__ `[]`  
__Expected return value:__ _Nothing_

#### Arguments

| Name      | Description                    | Type            | Required | Can be empty |
| --------- | ------------------------------ | --------------- | -------- | ------------ |
| toRelease | Projects that will be released | `Array(String)` | No       | Yes          |
| Listr     | Listr instance                 |                 | No       |              |

### release-preconditions

Release preconditions.

__Initial value:__ `[]`  
__Expected return value:__ _Nothing_

#### Arguments

| Name      | Description                    | Type            | Required | Can be empty |
| --------- | ------------------------------ | --------------- | -------- | ------------ |
| toRelease | Projects that will be released | `Array(String)` | No       | Yes          |
| Listr     | Listr instance                 |                 | No       |              |

### run-script

Invoked for build, clean, lint, release and test making it possible to customize what is done and extend existing functionality, the functions can return a promise.

__Initial value:__ _Nothing_  
__Expected return value:__ `Function / Array(Function)`

#### Arguments

| Name     | Description                                                                                                                                                                  | Type              | Required | Can be empty |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------- | ------------ |
| script   | The script that has been invoked, can be either `build`, `clean`, `lint`, `release` or `test`.                                                                               | `String`          | No       | Yes          |
| projects | The projects that the script has been invoked for.                                                                                                                           | `Array(Object())` | No       | Yes          |
| extra    | Additional arguments containing `options`, `extraArguments` from the command as well as `createLogger` that takes a name and returns a function that can be used for logging | `Object()`        | No       | Yes          |

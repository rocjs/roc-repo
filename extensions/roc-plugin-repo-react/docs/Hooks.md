# Hooks for `roc-plugin-repo-react`

## Hooks
* [roc](#roc)
  * [update-settings](#update-settings)
* [roc-plugin-repo-react](#roc-plugin-repo-react)
  * [babel-config](#babel-config)
  * [get-projects](#get-projects)

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

## roc-plugin-repo-react

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

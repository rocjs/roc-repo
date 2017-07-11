# roc-repo

Roc plugin making it easy to manage JavaScript repositories

## Why?

Simplifies management of JavaScript repositories, supporting both monorepos and standard repositories.

## Plugins

- [roc-plugin-repo](/extensions/roc-plugin-repo)
- [roc-plugin-repo-roc](/extensions/roc-plugin-repo-roc)
- [roc-plugin-repo-react](/extensions/roc-plugin-repo-react)

## Overview

More to follow.

## Contribute

Use the local plugin on this repo by adding the following to the `package.json`.

```json
"roc": {
  "plugins": [
    "./extensions/roc-plugin-repo/lib",
    "./extensions/roc-plugin-repo-roc/lib"
  ]
}
```

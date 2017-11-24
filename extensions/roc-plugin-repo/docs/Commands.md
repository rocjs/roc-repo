# Commands for `roc-plugin-repo`

## General Information
All commands can be called with some additional options illustrated in the table below.

### General options

| Name                  | Description                                    | Required |
| --------------------- | ---------------------------------------------- | -------- |
| -b, --better-feedback | Enables source-map-support and loud-rejection. | No       |
| -c, --config          | Path to configuration file.                    | No       |
| -d, --directory       | Path to working directory.                     | No       |
| -h, --help            | Output usage information.                      | No       |
| -V, --verbose         | Enable verbose mode.                           | No       |
| -v, --version         | Output version number.                         | No       |

## Commands
* [meta](#meta)
    * [docs](#docs)
    * [list-settings](#list-settings)
* [repo](#repo)
    * [bootstrap](#bootstrap)
    * [build](#build)
    * [clean](#clean)
    * [commit](#commit)
    * [exec](#exec)
    * [graph](#graph)
    * [lint](#lint)
    * [list](#list)
    * [release](#release)
    * [rnm](#rnm)
    * [run](#run)
    * [status](#status)
    * [test](#test)
    * [unlink](#unlink)

## meta
__Meta commands__

```
roc meta <command>
```
Meta commands that can be used to generate meta data about the current project.


### docs
__Generates documentation for the current project.__

```
roc meta docs
```

#### Command options

| Name       | Description                                                   | Default        | Type                                                              | Required | Can be empty |
| ---------- | ------------------------------------------------------------- | -------------- | ----------------------------------------------------------------- | -------- | ------------ |
| --html     | If HTML should be generated. (Not supported yet)              | `false`        | `Boolean`                                                         | No       |              |
| --markdown | If markdown should be generated.                              | `true`         | `Boolean`                                                         | No       |              |
| --mode     | The platform that is to be used, for link generation.         | `"github.com"` | `/github\.com|nodejs\.org|bitbucket\.org|ghost\.org|gitlab\.com/` | No       |              |
| --output   | A directory to place the generated documentation inside of.   | `"docs"`       | `String`                                                          | No       | No           |
| --project  | If the projects configuration and actions should be included. | `false`        | `Boolean`                                                         | No       |              |

####  Defined by extensions
roc

### list-settings
__Prints all the available settings that can be changed.__

```
roc meta list-settings
```

####  Defined by extensions
roc

## repo
```
roc repo <command>
```

### bootstrap
__Installs and links the projects__

```
roc repo bootstrap [projects]
```

#### Arguments

| Name         | Description                                                                                            | Default | Type                | Required | Can be empty |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------- | ------------------- | -------- | ------------ |
| projects     | Projects to use                                                                                        |         | `Array(String)`     | No       | Yes          |

#### Command options

| Name         | Description                                                                                            | Default | Type                | Required | Can be empty |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------- | ------------------- | -------- | ------------ |
| --concurrent | Run concurrently                                                                                       | `2`     | `Boolean / Integer` | No       |              |
| --linkAll    | If all projects should be linked with each other, ignoring SemVer ranges                               | `false` | `Boolean`           | No       |              |
| --prerelease | If a prerelease should be done, and what name that should be used for the tag, will default to "alpha" | `false` | `Boolean / String`  | No       |              |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### build
__Builds projects__

```
roc repo build [projects]
```

#### Arguments

| Name        | Description        | Default | Type            | Required | Can be empty |
| ----------- | ------------------ | ------- | --------------- | -------- | ------------ |
| projects    | Projects to use    |         | `Array(String)` | No       | Yes          |

#### Command options

| Name        | Description        | Default | Type            | Required | Can be empty |
| ----------- | ------------------ | ------- | --------------- | -------- | ------------ |
| -w, --watch | Enabled watch mode |         | `Boolean`       | No       |              |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### clean
__Cleans generated files__

```
roc repo clean [projects]
```

#### Arguments

| Name     | Description     | Default | Type            | Required | Can be empty |
| -------- | --------------- | ------- | --------------- | -------- | ------------ |
| projects | Projects to use |         | `Array(String)` | No       | Yes          |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### commit
__Use commitizen when doing a commit, pass arguments with --__

```
roc repo commit
```

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### exec
__Run an arbitrary command in each project, will invoke what comes after --__

```
roc repo exec [projects]
```

#### Arguments

| Name         | Description      | Default | Type                | Required | Can be empty |
| ------------ | ---------------- | ------- | ------------------- | -------- | ------------ |
| projects     | Projects to use  |         | `Array(String)`     | No       | Yes          |

#### Command options

| Name         | Description      | Default | Type                | Required | Can be empty |
| ------------ | ---------------- | ------- | ------------------- | -------- | ------------ |
| --concurrent | Run concurrently | `false` | `Boolean / Integer` | No       |              |
| --silent     | Silent output    | `true`  | `Boolean`           | No       |              |

####  Defined by extensions
roc-plugin-repo

### graph
__Shows how the projects are connected with each other__

```
roc repo graph [projects]
```

#### Arguments

| Name         | Description                                                                                            | Default | Type               | Required | Can be empty |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------- | ------------------ | -------- | ------------ |
| projects     | Projects to use                                                                                        |         | `Array(String)`    | No       | Yes          |

#### Command options

| Name         | Description                                                                                            | Default | Type               | Required | Can be empty |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------- | ------------------ | -------- | ------------ |
| --prerelease | If a prerelease should be done, and what name that should be used for the tag, will default to "alpha" | `false` | `Boolean / String` | No       |              |

####  Defined by extensions
roc-plugin-repo

### lint
__Runs lint__

```
roc repo lint [projects]
```

#### Arguments

| Name           | Description                               | Default | Type            | Required | Can be empty |
| -------------- | ----------------------------------------- | ------- | --------------- | -------- | ------------ |
| projects       | Projects to use                           |         | `Array(String)` | No       | Yes          |

#### Command options

| Name           | Description                               | Default | Type            | Required | Can be empty |
| -------------- | ----------------------------------------- | ------- | --------------- | -------- | ------------ |
| --fix          | Use ESLint --fix option                   |         | `Boolean`       | No       |              |
| --forceDefault | Force use of default ESLint configuration | `false` | `Boolean`       | No       |              |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### list
__List the projects that will be used when running the commands__

```
roc repo list
```

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### release
__Perform a release__

```
roc repo release [projects]
```

#### Arguments

| Name         | Description                                                                                                    | Default    | Type               | Required | Can be empty |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | -------- | ------------ |
| projects     | Projects to use                                                                                                |            | `Array(String)`    | No       | Yes          |

#### Command options

| Name         | Description                                                                                                    | Default    | Type               | Required | Can be empty |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | -------- | ------------ |
| --automatic  | If an automated release should be performed, useful for CI environments                                        | `false`    | `Boolean`          | No       |              |
| --clean      | If the project should be cleaned                                                                               | `true`     | `Boolean`          | No       |              |
| --dist-tag   | dist-tag to be used when publishing to npm                                                                     | `"latest"` | `String`           | No       | Yes          |
| --draft      | If the GitHub release should be done as a draft or not                                                         | `true`     | `Boolean`          | No       |              |
| --from       | Manually specify from which commit the status generation should be performed, by default all commits           |            | `String`           | No       | Yes          |
| --git        | If project commits should be created                                                                           | `true`     | `Boolean`          | No       |              |
| --git-email  | Email to use for Git author over the default                                                                   |            | `String`           | No       | Yes          |
| --git-name   | Name to use for Git author over the default                                                                    |            | `String`           | No       | Yes          |
| --github     | If a GitHub release should be made, will read from GITHUB_AUTH if true or use the value provided to the option | `true`     | `Boolean / String` | No       |              |
| --prerelease | If a prerelease should be done, and what name that should be used for the tag, will default to "alpha"         | `false`    | `Boolean / String` | No       |              |
| --publish    | If projects should be published                                                                                | `true`     | `Boolean`          | No       |              |
| --push       | If commits should be pushed to the remote                                                                      | `true`     | `Boolean`          | No       |              |
| --tag        | If git tags should be created                                                                                  | `true`     | `Boolean`          | No       |              |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### rnm
__Removes node_modules folders in projects__

```
roc repo rnm [projects]
```

#### Arguments

| Name     | Description     | Default | Type            | Required | Can be empty |
| -------- | --------------- | ------- | --------------- | -------- | ------------ |
| projects | Projects to use |         | `Array(String)` | No       | Yes          |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### run
__Run npm scripts in projects.__

```
roc repo run [command] [projects]
```

#### Arguments

| Name         | Description             | Default | Type                | Required | Can be empty |
| ------------ | ----------------------- | ------- | ------------------- | -------- | ------------ |
| command      | The command to invoke   |         | `String`            | No       | Yes          |
| projects     | Projects to use         |         | `Array(String)`     | No       | Yes          |

#### Command options

| Name         | Description             | Default | Type                | Required | Can be empty |
| ------------ | ----------------------- | ------- | ------------------- | -------- | ------------ |
| --concurrent | Run concurrently        | `false` | `Boolean / Integer` | No       |              |
| --list       | Lists possible commands | `false` | `Boolean`           | No       |              |

####  Settings options
* [mono](docs/Settings.md#mono)

####  Defined by extensions
roc-plugin-repo

### status
__Generate status about release state for projects__

```
roc repo status [projects]
```

#### Arguments

| Name         | Description                                                                                            | Default | Type               | Required | Can be empty |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------- | ------------------ | -------- | ------------ |
| projects     | Projects to use                                                                                        |         | `Array(String)`    | No       | Yes          |

#### Command options

| Name         | Description                                                                                            | Default | Type               | Required | Can be empty |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------- | ------------------ | -------- | ------------ |
| --from       | Manually specify from which commit the status generation should be performed, by default all commits   |         | `String`           | No       | Yes          |
| --prerelease | If a prerelease should be done, and what name that should be used for the tag, will default to "alpha" | `false` | `Boolean / String` | No       |              |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### test
__Run tests using Jest__

```
roc repo test [projects]
```

#### Arguments

| Name                           | Description                                                                                                                                                                                                                                                  | Default | Type              | Required | Can be empty |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ----------------- | -------- | ------------ |
| projects                       | Projects to use                                                                                                                                                                                                                                              |         | `Array(String)`   | No       | Yes          |

#### Command options

| Name                           | Description                                                                                                                                                                                                                                                  | Default | Type              | Required | Can be empty |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ----------------- | -------- | ------------ |
| --automock                     | Automock all files by default.                                                                                                                                                                                                                               |         | `Boolean`         | No       |              |
| --bail                         | Exit the test suite immediately upon the first failing test.                                                                                                                                                                                                 |         | `Boolean`         | No       |              |
| --browser                      | Respect the "browser" field in package.json when resolving modules. Some packages export different versions based on whether they are operating in node.js or a browser.                                                                                     |         | `Boolean`         | No       |              |
| --cache                        | Whether to use the transform cache. Disable the cache using --no-cache.                                                                                                                                                                                      |         | `Boolean`         | No       |              |
| --cacheDirectory               | The directory where Jest should store its cached  dependency information.                                                                                                                                                                                    |         | `String`          | No       | Yes          |
| --ci                           | Whether to run Jest in continuous integration (CI) mode. This option is on by default in most popular CI environments. It will  prevent snapshots from being written unless explicitly requested.                                                            | `false` | `Boolean`         | No       |              |
| --clearMocks                   | Automatically clear mock calls and instances between every test. Equivalent to calling jest.clearAllMocks() between each test.                                                                                                                               |         | `Boolean`         | No       |              |
| --collectCoverage              | Alias for --coverage.                                                                                                                                                                                                                                        |         | `Boolean`         | No       |              |
| --collectCoverageFrom          | relative to <rootDir> glob pattern matching the files that coverage info needs to be collected from.                                                                                                                                                         |         | `String`          | No       | Yes          |
| --collectCoverageOnlyFrom      | Explicit list of paths coverage will be restricted to.                                                                                                                                                                                                       |         | `Array(Filepath)` | No       | Yes          |
| --color                        | Forces test results output color highlighting (even if stdout is not a TTY). Set to false if you would like to have no colors.                                                                                                                               |         | `Boolean`         | No       |              |
| --colors                       | Alias for `--color`.                                                                                                                                                                                                                                         |         | `Boolean`         | No       |              |
| --config                       | The path to a jest config file specifying how to find and execute tests. If no rootDir is set in the config, the current directory is assumed to be the rootDir for the project. This can also be a JSON encoded value which Jest will use as configuration. |         | `String`          | No       | Yes          |
| --coverage                     | Indicates that test coverage information should be collected and reported in the output.                                                                                                                                                                     |         | `Boolean`         | No       |              |
| --coverageDirectory            | The directory where Jest should output its coverage files.                                                                                                                                                                                                   |         | `String`          | No       | Yes          |
| --coveragePathIgnorePatterns   | An array of regexp pattern strings that are matched against all file paths before executing the test. If the file pathmatches any of the patterns, coverage information will be skipped.                                                                     |         | `Array(Filepath)` | No       | Yes          |
| --coverageReporters            | A list of reporter names that Jest uses when writing coverage reports. Any istanbul reporter can be used.                                                                                                                                                    |         | `Array(Filepath)` | No       | Yes          |
| --coverageThreshold            | A JSON string with which will be used to configure minimum threshold enforcement for coverage results                                                                                                                                                        |         | `String`          | No       | Yes          |
| --debug                        | Print debugging info about your jest config.                                                                                                                                                                                                                 |         | `Boolean`         | No       |              |
| --env                          | The test environment used for all tests. This can point to any file or node module. Examples: `jsdom`, `node` or `path/to/my-environment.js`                                                                                                                 |         | `String`          | No       | Yes          |
| -e, --expand                   | Use this flag to show full diffs instead of a patch.                                                                                                                                                                                                         |         | `Boolean`         | No       |              |
| --findRelatedTests             | Find related tests for a list of source files that were passed in as arguments. Useful for pre-commit hook integration to run the minimal amount of tests necessary.                                                                                         |         | `Boolean`         | No       |              |
| --forceExit                    | Force Jest to exit after all tests have completed running. This is useful when resources set up by test code cannot be adequately cleaned up.                                                                                                                |         | `Boolean`         | No       |              |
| --globals                      | A JSON string with map of global variables that need to be available in all test environments.                                                                                                                                                               |         | `String`          | No       | Yes          |
| --haste                        | A JSON string with map of variables for the haste  module system                                                                                                                                                                                             |         | `String`          | No       | Yes          |
| --json                         | Prints the test results in JSON. This mode will send all other test output and user messages to stderr.                                                                                                                                                      |         | `Boolean`         | No       |              |
| --lastCommit                   | Will run all tests affected by file changes in the last commit made.                                                                                                                                                                                         |         | `Boolean`         | No       |              |
| --listTests                    | Lists all tests Jest will run given the arguments and exits. Most useful in a CI system together with `--findRelatedTests` to determine the tests Jest will run based on specific files                                                                      | `false` | `Boolean`         | No       |              |
| --logHeapUsage                 | Logs the heap usage after every test. Useful to debug memory leaks. Use together with `--runInBand` and `--expose-gc` in node.                                                                                                                               |         | `Boolean`         | No       |              |
| --mapCoverage                  | Maps code coverage reports against original source code when transformers supply source maps.                                                                                                                                                                |         | `Boolean`         | No       |              |
| -w, --maxWorkers               | Specifies the maximum number of workers the worker-pool will spawn for running tests. This defaults to the number of the cores available on your machine. (its usually best not to override this default)                                                    |         |                   | No       |              |
| --moduleDirectories            | An array of directory names to be searched recursively up from the requiring module's location.                                                                                                                                                              |         | `Array(Filepath)` | No       | Yes          |
| --moduleFileExtensions         | An array of file extensions your modules use. If you require modules without specifying a file extension, these are the extensions Jest will look for.                                                                                                       |         | `Array(Filepath)` | No       | Yes          |
| --moduleNameMapper             | A JSON string with a map from regular expressions to module names that allow to stub out resources, like images or styles with a single module                                                                                                               |         | `String`          | No       | Yes          |
| --modulePathIgnorePatterns     | An array of regexp pattern strings that are matched against all module paths before those paths are to be considered "visible" to the module loader.                                                                                                         |         | `Array(Filepath)` | No       | Yes          |
| --modulePaths                  | An alternative API to setting the NODE_PATH env variable, modulePaths is an array of absolute paths to additional locations to search when resolving modules.                                                                                                |         | `Array(Filepath)` | No       | Yes          |
| --noStackTrace                 | Disables stack trace in test results output                                                                                                                                                                                                                  |         | `Boolean`         | No       |              |
| --notify                       | Activates notifications for test results.                                                                                                                                                                                                                    |         | `Boolean`         | No       |              |
| -o, --onlyChanged              | Attempts to identify which tests to run based on which files have changed in the current repository. Only works if you're running tests in a git repository at the moment.                                                                                   |         | `Boolean`         | No       |              |
| --outputFile                   | Write test results to a file when the --json option is also specified.                                                                                                                                                                                       |         | `String`          | No       | Yes          |
| --preset                       | A preset that is used as a base for Jest's configuration.                                                                                                                                                                                                    |         | `String`          | No       | Yes          |
| --projects                     | A list of projects that use Jest to run all tests of all projects in a single instance of Jest.                                                                                                                                                              |         | `Array(Filepath)` | No       | Yes          |
| --reporters                    | A list of custom reporters for the test suite.                                                                                                                                                                                                               |         | `Array(Filepath)` | No       | Yes          |
| --resetMocks                   | Automatically reset mock state between every test. Equivalent to calling jest.resetAllMocks() between each test.                                                                                                                                             |         | `Boolean`         | No       |              |
| --resetModules                 | If enabled, the module registry for every test file will be reset before running each individual test.                                                                                                                                                       |         | `Boolean`         | No       |              |
| --resolver                     | A JSON string which allows the use of a custom resolver.                                                                                                                                                                                                     |         | `String`          | No       | Yes          |
| --rootDir                      | The root directory that Jest should scan for tests and modules within.                                                                                                                                                                                       |         | `String`          | No       | Yes          |
| --roots                        | A list of paths to directories that Jest should use to search for files in.                                                                                                                                                                                  |         | `Array(Filepath)` | No       | Yes          |
| -i, --runInBand                | Run all tests serially in the current process (rather than creating a worker pool of child processes that run tests). This is sometimes useful for debugging, but such use cases are pretty rare.                                                            |         | `Boolean`         | No       |              |
| --setupFiles                   | The paths to modules that run some code to configure or set up the testing environment before each test.                                                                                                                                                     |         | `Array(Filepath)` | No       | Yes          |
| --setupTestFrameworkScriptFile | The path to a module that runs some code to configure or set up the testing framework before each test.                                                                                                                                                      |         | `String`          | No       | Yes          |
| --showConfig                   | Print your jest config and then exits.                                                                                                                                                                                                                       |         | `Boolean`         | No       |              |
| --silent                       | Prevent tests from printing messages through the console.                                                                                                                                                                                                    |         | `Boolean`         | No       |              |
| --snapshotSerializers          | A list of paths to snapshot serializer modules Jest should use for snapshot testing.                                                                                                                                                                         |         | `Array(Filepath)` | No       | Yes          |
| --testEnvironment              | Alias for --env                                                                                                                                                                                                                                              |         | `String`          | No       | Yes          |
| --testMatch                    | The glob patterns Jest uses to detect test files.                                                                                                                                                                                                            |         | `Array(Filepath)` | No       | Yes          |
| -t, --testNamePattern          | Run only tests with a name that matches the regex pattern.                                                                                                                                                                                                   |         | `String`          | No       | Yes          |
| --testPathIgnorePatterns       | An array of regexp pattern strings that are matched against all test paths before executing the test. If the test path matches any of the patterns, it will be skipped.                                                                                      |         | `Array(Filepath)` | No       | Yes          |
| --testPathPattern              | A regexp pattern string that is matched against all tests paths before executing the test.                                                                                                                                                                   |         | `String`          | No       | Yes          |
| --testRegex                    | The regexp pattern Jest uses to detect test files.                                                                                                                                                                                                           |         | `String`          | No       | Yes          |
| --testResultsProcessor         | Allows the use of a custom results processor. This processor must be a node module that exports a function expecting as the first argument the result object                                                                                                 |         | `String`          | No       | Yes          |
| --testRunner                   | Allows to specify a custom test runner. The default is  `jasmine2`. A path to a custom test runner can be provided: `<rootDir>/path/to/testRunner.js`.                                                                                                       |         | `String`          | No       | Yes          |
| --testURL                      | This option sets the URL for the jsdom environment.                                                                                                                                                                                                          |         | `String`          | No       | Yes          |
| --timers                       | Setting this value to fake allows the use of fake timers for functions such as setTimeout.                                                                                                                                                                   |         | `String`          | No       | Yes          |
| --transform                    | A JSON string which maps from regular expressions to paths to transformers.                                                                                                                                                                                  |         | `String`          | No       | Yes          |
| --transformIgnorePatterns      | An array of regexp pattern strings that are matched against all source file paths before transformation.                                                                                                                                                     |         | `Array(Filepath)` | No       | Yes          |
| --unmockedModulePathPatterns   | An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them.                                                                                                                  |         | `Array(Filepath)` | No       | Yes          |
| -u, --updateSnapshot           | Use this flag to re-record snapshots. Can be used together with a test suite pattern or with `--testNamePattern` to re-record snapshot for test matching the pattern                                                                                         |         | `Boolean`         | No       |              |
| --useStderr                    | Divert all output to stderr.                                                                                                                                                                                                                                 |         | `Boolean`         | No       |              |
| --verbose                      | Display individual test results with the test suite hierarchy.                                                                                                                                                                                               |         | `Boolean`         | No       |              |
| --version                      | Print the version and exit                                                                                                                                                                                                                                   |         | `Boolean`         | No       |              |
| --watch                        | Watch files for changes and rerun tests related to changed files. If you want to re-run all tests when a file has changed, use the `--watchAll` option.                                                                                                      |         | `Boolean`         | No       |              |
| --watchAll                     | Watch files for changes and rerun all tests. If you want to re-run only the tests related to the changed files, use the `--watch` option.                                                                                                                    |         | `Boolean`         | No       |              |
| --watchman                     | Whether to use watchman for file crawling. Disable using --no-watchman.                                                                                                                                                                                      |         | `Boolean`         | No       |              |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo

### unlink
__Unlinks the projects__

```
roc repo unlink [projects]
```

#### Arguments

| Name     | Description     | Default | Type            | Required | Can be empty |
| -------- | --------------- | ------- | --------------- | -------- | ------------ |
| projects | Projects to use |         | `Array(String)` | No       | Yes          |

####  Settings options
_All groups are available._
* [repo](docs/Settings.md#repo)

####  Defined by extensions
roc-plugin-repo


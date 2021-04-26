# Release version
GitHub Action to create release branch. By default, it will amend `package.json` and `CHANGELOG.md` located in the root of the repository.
If project is specified - aforementioned files will be located conforming Babylon structure.

## Inputs

### `version`

`string`

Required. Version that needs to be released from base branch.

### `project`

`string`

Optional. Project name release is created for. Only for babylon-enabled projects.


### `strategy`

`string`

Required. Either `release` which is calm an normal or `hotfix` for firefighters.

### `production`

`string`

Required. Branch name, where release will go. If `project` is also specifed, this will be concatenated together.

### `release-date-format`

`string`

Required. Default `DD.MM.YYYY`. String representing template of the date that should be added to Changelog.
Example: `YYYY-MM-DD`

## Usage Example

````yaml
on:
  # manually dispatched from Actions tab with Run Workflow
  workflow_dispatch:
    inputs:
      version:
        description: 'Version'
        required: true
      project:
        description: 'Project'
jobs:
  release-version:
    name: Release Version
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/release-version@v1
        with:
          token: ${{github.token}}
          version: ${{github.event.inputs.version}}
          strategy: 'release'
          production: 'prev-production'
          release-date-format: 'YYYY-MM-DD'

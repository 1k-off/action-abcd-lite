# ABCD Lite action

This repository contains Azure Pipelines task and GitHub action for [abcd-lite](https://github.com/1k-off/abcd-lite). 

## General info
The action contains two types of inputs: inputs that can be read from both config files and inline values, and inputs that can only be read from inline values (typically secrets).

**Behavior:**
- If the config file exists, its values are loaded and merged with inline task inputs.
- Inline task inputs always override config file values if both are set.
- If the config file does **not** exist, all values must be provided via direct task inputs.

**Note:**
- Inline task parameters (`abcdlite_url`, `api_key`, `username`, `password`, `package_ref`) must be set only from inline inputs.
- Do not store secrets (like passwords) in the config file if your repo is public.


### Config file
Place this file in your repo (default: `.abcd-lite.yml` or specify with `config_path`).

```yaml
project_id: "1234567890"           # (string) Project identifier for deployment
api_key: "abcdefg123456"           # (string) API key for authentication (if required by your API)
site_name: "test"                  # (string) Name of the IIS site to deploy to
stop_app_pool_before_deploy: true   # (bool) Stop the app pool before deployment
start_app_pool_after_deploy: true   # (bool) Start the app pool after deployment
clean_deployment: true              # (bool) Clean the deployment directory before deploying
exclude:                            # (list) List of files or directories to exclude from deployment
  - "test"
  - "test2"
```

## GitHub Actions

Store sensitive values like `deployment_token` and `package_password` in GitHub Secrets.

**Example workflow:**
```yaml
      - name: Deploy IIS site with ABCD Lite
        uses: 1k-off/action-abcd-lite@v1
        with:
          abcdlite_url: 'https://abcd-lite.acme.com'
          package_username: ${{ secrets.DOCKERHUB_USERNAME }}
          package_password: ${{ secrets.DOCKERHUB_TOKEN }}
          package_ref: 'docker.io/acme/artifact:v1.0.1'
          project_id: '000000000000000'
          deployment_token: ${{ secrets.ABCDLITE_DEPLOY_TOKEN }}
          site_name: 'example.acme.com'
          exclude: |
            media
            pdf
            some/dir/to/keep
```

**Extended example with artifact push and versioning**
```yaml
name: Deploy with ABCD Lite
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - name: Set version
        id: version
        run: |
          ver="$(date +%Y%m%d-%H%M)"
          echo "version=$ver" >> $GITHUB_OUTPUT

      # some build actions (node, dotnet, go, etc)

      # Install ORAS CLI using the official action
      - uses: oras-project/setup-oras@v1
        with:
          version: 1.2.3
      # Push artifacts using ORAS
      - name: Push Artifact
        uses: 1k-off/action-oras-push@v1
        with:
          registry: docker.io
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
          repository: acme/artifact
          tag: ${{ steps.version.outputs.version }}
          files: |
            dist/
            index.html
          manifest-annotations: "key1=value1,key2=value2"

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy IIS site with ABCD Lite
        uses: 1k-off/action-abcd-lite@v1
        with:
          abcdlite_url: 'https://abcd-lite.acme.com'
          package_username: ${{ secrets.DOCKERHUB_USERNAME }}
          package_password: ${{ secrets.DOCKERHUB_TOKEN }}
          package_ref: 'docker.io/acme/artifact:${{ needs.build.outputs.version }}'
          project_id: '000000000000000'
          deployment_token: ${{ secrets.ABCDLITE_DEPLOY_TOKEN }}
          site_name: 'example.acme.com'
          exclude: |
            media
            pdf
            some/dir/to/keep
```


## Azure DevOps

Create variable group and store sensitive values like `api_key` there.

**Example:**
```yaml
- task: ABCDLiteDeploy@0
  inputs:
    abcdlite_url: 'https://abcd-lite.acme.com'
    package_username: '$(DockerHubUsername)'
    package_password: '$(DockerHubToken)'
    package_ref: 'docker.io/acme/artifact:v1.0.1'
    project_id: '000000000000000'
    deployment_token: '$(ABCDLiteDeployToken)'
    site_name: 'example.acme.com'
    exclude: |
      media
      pdf
      some/dir/to/keep
```

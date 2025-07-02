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

## Azure DevOps

Create variable group and store sensitive values like `api_key` there.

**Example:**
```yaml
- task: ABCDLiteDeploy@0
  inputs:
    abcdlite_url: 'https://abcd-lite.acme.com'
    package_username: '$(DockerHubUsername)'
    package_password: '$(DockerHubToken)'
    package_ref: 'docker.io/kosar/test-html-artifact:v1.0.1'
    project_id: '000000000000000'
    deployment_token: '$(ABCDLiteDeployToken)'
    site_name: 'example.acme.com'
    exclude: |
      media
      pdf
      some/dir/to/keep
```
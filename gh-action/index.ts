import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as yaml from 'js-yaml';

async function run() {
  try {
    const abcdlite_url = core.getInput('abcdlite_url', { required: true });
    const package_username = core.getInput('package_username') || undefined;
    const package_password = core.getInput('package_password') || undefined;
    const package_ref = core.getInput('package_ref', { required: true });
    const config_path = core.getInput('config_path') || '.abcd-lite.yml';

    const project_id = core.getInput('project_id');
    const deployment_token = core.getInput('deployment_token');
    const site_name = core.getInput('site_name');
    const stop_app_pool_before_deploy = core.getBooleanInput('stop_app_pool_before_deploy');
    const start_app_pool_after_deploy = core.getBooleanInput('start_app_pool_after_deploy');
    const clean_deployment = core.getBooleanInput('clean_deployment');
    const exclude = core.getInput('exclude');

    let configVars: any = {};
    const configFullPath = path.resolve(config_path);
    if (fs.existsSync(configFullPath)) {
      const fileContents = fs.readFileSync(configFullPath, 'utf8');
      configVars = yaml.load(fileContents) || {};
      core.debug(`Loaded config from ${configFullPath}: ${JSON.stringify(configVars)}`);
    } else {
      core.debug(`Config file not found at ${configFullPath}, proceeding with inline params only.`);
    }

    const package_info: any = {
      package_ref,
      credentials: {}
    };
    if (package_username) package_info.credentials.username = package_username;
    if (package_password) package_info.credentials.password = package_password;

    let payload: any = { ...configVars };
    if (project_id) payload.project_id = project_id;
    if (deployment_token) payload.deploy_key = deployment_token;
    if (site_name) payload.site_name = site_name;
    if (stop_app_pool_before_deploy !== undefined) payload.stop_app_pool_before_deploy = stop_app_pool_before_deploy;
    if (start_app_pool_after_deploy !== undefined) payload.start_app_pool_after_deploy = start_app_pool_after_deploy;
    if (clean_deployment !== undefined) payload.clean_deployment = clean_deployment;
    if (exclude) payload.exclude = exclude.split('\n').map(s => s.trim()).filter(Boolean);
    payload.package_info = package_info;

    if (!fs.existsSync(configFullPath)) {
      payload = {};
      if (project_id) payload.project_id = project_id;
      if (deployment_token) payload.deploy_key = deployment_token;
      if (site_name) payload.site_name = site_name;
      if (stop_app_pool_before_deploy !== undefined) payload.stop_app_pool_before_deploy = stop_app_pool_before_deploy;
      if (start_app_pool_after_deploy !== undefined) payload.start_app_pool_after_deploy = start_app_pool_after_deploy;
      if (clean_deployment !== undefined) payload.clean_deployment = clean_deployment;
      if (exclude) payload.exclude = exclude.split('\n').map(s => s.trim()).filter(Boolean);
      payload.package_info = package_info;
    }

    const debugPayload = JSON.parse(JSON.stringify(payload));
    if (debugPayload.package_info && debugPayload.package_info.credentials && debugPayload.package_info.credentials.password) {
      debugPayload.package_info.credentials.password = '***';
    }
    core.debug(`POSTing to ${abcdlite_url}/deploy/iis with payload: ${JSON.stringify(debugPayload)}`);

    const apiUrl = `${abcdlite_url.replace(/\/$/, '')}/deploy/iis`;
    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status >= 200 && response.status < 300) {
      core.setOutput('result', `Deployment triggered successfully: ${JSON.stringify(response.data)}`);
    } else {
      core.setFailed(`API call failed: ${response.status} ${response.statusText}`);
    }
  } catch (err: any) {
    core.setFailed(err.message || 'Action failed with unknown error');
  }
}

run();

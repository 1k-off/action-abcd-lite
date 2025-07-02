import tl = require('azure-pipelines-task-lib/task');
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as yaml from 'js-yaml';

async function run() {
  try {
    const abcdlite_url = tl.getInput('abcdlite_url', true)!;
    const package_username = tl.getInput('package_username', false) || undefined;
    const package_password = tl.getInput('package_password', false) || undefined;
    const package_ref = tl.getInput('package_ref', true)!;
    const config_path = tl.getInput('config_path', false) || '.abcd-lite.yml';

    const project_id = tl.getInput('project_id', false);
    const deployment_token = tl.getInput('deployment_token', false);
    const site_name = tl.getInput('site_name', false);
    const stop_app_pool_before_deploy = tl.getBoolInput('stop_app_pool_before_deploy', false);
    const start_app_pool_after_deploy = tl.getBoolInput('start_app_pool_after_deploy', false);
    const clean_deployment = tl.getBoolInput('clean_deployment', false);
    const exclude = tl.getInput('exclude', false);

    let configVars: any = {};
    const configFullPath = path.resolve(config_path);
    if (fs.existsSync(configFullPath)) {
      const fileContents = fs.readFileSync(configFullPath, 'utf8');
      configVars = yaml.load(fileContents) || {};
      tl.debug(`Loaded config from ${configFullPath}: ${JSON.stringify(configVars)}`);
    } else {
      tl.debug(`Config file not found at ${configFullPath}, proceeding with inline params only.`);
    }


    const package_info: any = {
      package_ref,
      credentials: {}
    };
    if (package_username) package_info.credentials.username = package_username;
    if (package_password) package_info.credentials.password = package_password;


    let payload: any = { ...configVars };
    if (project_id) payload.project_id = project_id;
    if (deployment_token) payload.api_key  = deployment_token;
    if (site_name) payload.site_name = site_name;
    if (stop_app_pool_before_deploy !== undefined) payload.stop_app_pool_before_deploy = stop_app_pool_before_deploy;
    if (start_app_pool_after_deploy !== undefined) payload.start_app_pool_after_deploy = start_app_pool_after_deploy;
    if (clean_deployment !== undefined) payload.clean_deployment = clean_deployment;
    if (exclude) payload.exclude = exclude.split('\n').map(s => s.trim()).filter(Boolean);
    payload.package_info = package_info;

    if (!fs.existsSync(configFullPath)) {
      payload = {};
      if (project_id) payload.project_id = project_id;
      if (deployment_token) payload.api_key = deployment_token;
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
    tl.debug(`POSTing to ${abcdlite_url}/deploy/iis with payload: ${JSON.stringify(debugPayload)}`);


    const apiUrl = `${abcdlite_url.replace(/\/$/, '')}/deploy/iis`;
    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status >= 200 && response.status < 300) {
      tl.setResult(tl.TaskResult.Succeeded, `Deployment triggered successfully: ${JSON.stringify(response.data)}`);
    } else {
      tl.setResult(tl.TaskResult.Failed, `API call failed: ${response.status} ${response.statusText}`);
    }
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message || 'Task failed with unknown error');
  }
}

run(); 
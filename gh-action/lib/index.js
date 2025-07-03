"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const yaml = __importStar(require("js-yaml"));
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
        let configVars = {};
        const configFullPath = path.resolve(config_path);
        if (fs.existsSync(configFullPath)) {
            const fileContents = fs.readFileSync(configFullPath, 'utf8');
            configVars = yaml.load(fileContents) || {};
            core.debug(`Loaded config from ${configFullPath}: ${JSON.stringify(configVars)}`);
        }
        else {
            core.debug(`Config file not found at ${configFullPath}, proceeding with inline params only.`);
        }
        const package_info = {
            package_ref,
            credentials: {}
        };
        if (package_username)
            package_info.credentials.username = package_username;
        if (package_password)
            package_info.credentials.password = package_password;
        let payload = { ...configVars };
        if (project_id)
            payload.project_id = project_id;
        if (deployment_token)
            payload.deploy_key = deployment_token;
        if (site_name)
            payload.site_name = site_name;
        if (stop_app_pool_before_deploy !== undefined)
            payload.stop_app_pool_before_deploy = stop_app_pool_before_deploy;
        if (start_app_pool_after_deploy !== undefined)
            payload.start_app_pool_after_deploy = start_app_pool_after_deploy;
        if (clean_deployment !== undefined)
            payload.clean_deployment = clean_deployment;
        if (exclude)
            payload.exclude = exclude.split('\n').map(s => s.trim()).filter(Boolean);
        payload.package_info = package_info;
        if (!fs.existsSync(configFullPath)) {
            payload = {};
            if (project_id)
                payload.project_id = project_id;
            if (deployment_token)
                payload.deploy_key = deployment_token;
            if (site_name)
                payload.site_name = site_name;
            if (stop_app_pool_before_deploy !== undefined)
                payload.stop_app_pool_before_deploy = stop_app_pool_before_deploy;
            if (start_app_pool_after_deploy !== undefined)
                payload.start_app_pool_after_deploy = start_app_pool_after_deploy;
            if (clean_deployment !== undefined)
                payload.clean_deployment = clean_deployment;
            if (exclude)
                payload.exclude = exclude.split('\n').map(s => s.trim()).filter(Boolean);
            payload.package_info = package_info;
        }
        const debugPayload = JSON.parse(JSON.stringify(payload));
        if (debugPayload.package_info && debugPayload.package_info.credentials && debugPayload.package_info.credentials.password) {
            debugPayload.package_info.credentials.password = '***';
        }
        core.debug(`POSTing to ${abcdlite_url}/deploy/iis with payload: ${JSON.stringify(debugPayload)}`);
        const apiUrl = `${abcdlite_url.replace(/\/$/, '')}/deploy/iis`;
        const response = await axios_1.default.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.status >= 200 && response.status < 300) {
            core.setOutput('result', `Deployment triggered successfully: ${JSON.stringify(response.data)}`);
        }
        else {
            core.setFailed(`API call failed: ${response.status} ${response.statusText}`);
        }
    }
    catch (err) {
        core.setFailed(err.message || 'Action failed with unknown error');
    }
}
run();

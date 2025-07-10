"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeProjectOperation = executeProjectOperation;
const n8n_workflow_1 = require("n8n-workflow");
async function executeProjectOperation(params) {
    const { operation, i, baseUrl, apiKey } = params;
    let endpoint = '';
    let method = 'GET';
    let body = {};
    let qs = {};
    if (operation === 'get') {
        const projectId = this.getNodeParameter('projectId', i);
        method = 'GET';
        endpoint = `/projects/${projectId}.json`;
        qs.include = 'trackers,issue_categories,enabled_modules';
    }
    else if (operation === 'getAll') {
        const returnAll = this.getNodeParameter('returnAll', i);
        const filters = this.getNodeParameter('filters', i);
        method = 'GET';
        endpoint = '/projects.json';
        if (filters.status)
            qs.status = filters.status;
        if (!returnAll) {
            const limit = this.getNodeParameter('limit', i);
            qs.limit = limit;
        }
    }
    else if (operation === 'create') {
        const name = this.getNodeParameter('name', i);
        const identifier = this.getNodeParameter('identifier', i);
        const additionalFields = this.getNodeParameter('additionalFields', i);
        method = 'POST';
        endpoint = '/projects.json';
        const projectData = {
            name,
            identifier,
        };
        if (additionalFields.description)
            projectData.description = additionalFields.description;
        if (additionalFields.homepage)
            projectData.homepage = additionalFields.homepage;
        if (additionalFields.is_public !== undefined)
            projectData.is_public = additionalFields.is_public;
        if (additionalFields.parent_id)
            projectData.parent_id = additionalFields.parent_id;
        if (additionalFields.inherit_members !== undefined)
            projectData.inherit_members = additionalFields.inherit_members;
        if (additionalFields.customFields && additionalFields.customFields.field) {
            const customFields = [];
            for (const customField of additionalFields.customFields.field) {
                customFields.push({
                    id: customField.id,
                    value: customField.value,
                });
            }
            if (customFields.length > 0) {
                projectData.custom_fields = customFields;
            }
        }
        if (additionalFields.enabledModules && additionalFields.enabledModules.module) {
            const enabledModules = [];
            for (const module of additionalFields.enabledModules.module) {
                enabledModules.push({
                    name: module.name,
                });
            }
            if (enabledModules.length > 0) {
                projectData.enabled_modules = enabledModules;
            }
        }
        body = {
            project: projectData,
        };
    }
    else if (operation === 'update') {
        const projectId = this.getNodeParameter('projectId', i);
        const additionalFields = this.getNodeParameter('additionalFields', i);
        method = 'PUT';
        endpoint = `/projects/${projectId}.json`;
        const projectData = {};
        if (additionalFields.description !== undefined)
            projectData.description = additionalFields.description;
        if (additionalFields.homepage !== undefined)
            projectData.homepage = additionalFields.homepage;
        if (additionalFields.is_public !== undefined)
            projectData.is_public = additionalFields.is_public;
        if (additionalFields.parent_id !== undefined)
            projectData.parent_id = additionalFields.parent_id;
        if (additionalFields.inherit_members !== undefined)
            projectData.inherit_members = additionalFields.inherit_members;
        if (additionalFields.customFields && additionalFields.customFields.field) {
            const customFields = [];
            for (const customField of additionalFields.customFields.field) {
                customFields.push({
                    id: customField.id,
                    value: customField.value,
                });
            }
            if (customFields.length > 0) {
                projectData.custom_fields = customFields;
            }
        }
        if (additionalFields.enabledModules && additionalFields.enabledModules.module) {
            const enabledModules = [];
            for (const module of additionalFields.enabledModules.module) {
                enabledModules.push({
                    name: module.name,
                });
            }
            if (enabledModules.length > 0) {
                projectData.enabled_modules = enabledModules;
            }
        }
        body = {
            project: projectData,
        };
    }
    else if (operation === 'delete') {
        const projectId = this.getNodeParameter('projectId', i);
        method = 'DELETE';
        endpoint = `/projects/${projectId}.json`;
    }
    const options = {
        method,
        body,
        qs,
        uri: `${baseUrl}/` + endpoint.replace(/^\//, ''),
        headers: {
            'X-Redmine-API-Key': apiKey,
            'Content-Type': 'application/json',
        },
        json: true,
    };
    if (Object.keys(body).length === 0) {
        delete options.body;
    }
    let responseData;
    try {
        responseData = await this.helpers.request(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Redmine API error: ${error.message}`, { itemIndex: i });
    }
    return {
        json: responseData,
        pairedItem: {
            item: i,
        },
    };
}
//# sourceMappingURL=ProjectExecute.js.map
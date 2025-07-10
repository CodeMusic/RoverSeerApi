"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeUserOperation = executeUserOperation;
const n8n_workflow_1 = require("n8n-workflow");
async function executeUserOperation(params) {
    const { operation, i, baseUrl, apiKey } = params;
    let endpoint = '';
    let method = 'GET';
    let body = {};
    let qs = {};
    if (operation === 'get') {
        const userId = this.getNodeParameter('userId', i);
        method = 'GET';
        endpoint = `/users/${userId}.json`;
        qs.include = 'memberships,groups';
    }
    else if (operation === 'getCurrent') {
        method = 'GET';
        endpoint = '/users/current.json';
        qs.include = 'memberships,groups';
    }
    else if (operation === 'getAll') {
        const returnAll = this.getNodeParameter('returnAll', i);
        const filters = this.getNodeParameter('filters', i);
        method = 'GET';
        endpoint = '/users.json';
        if (filters.group_id)
            qs.group_id = filters.group_id;
        if (filters.name)
            qs.name = filters.name;
        if (filters.status)
            qs.status = filters.status;
        if (!returnAll) {
            const limit = this.getNodeParameter('limit', i);
            qs.limit = limit;
        }
    }
    else if (operation === 'create') {
        const login = this.getNodeParameter('login', i);
        const firstname = this.getNodeParameter('firstname', i);
        const lastname = this.getNodeParameter('lastname', i);
        const mail = this.getNodeParameter('mail', i);
        const password = this.getNodeParameter('password', i);
        const additionalFields = this.getNodeParameter('additionalFields', i);
        method = 'POST';
        endpoint = '/users.json';
        const userData = {
            login,
            firstname,
            lastname,
            mail,
            password,
        };
        if (additionalFields.admin !== undefined)
            userData.admin = additionalFields.admin;
        if (additionalFields.auth_source_id)
            userData.auth_source_id = additionalFields.auth_source_id;
        if (additionalFields.mail_notification)
            userData.mail_notification = additionalFields.mail_notification;
        if (additionalFields.must_change_passwd !== undefined)
            userData.must_change_passwd = additionalFields.must_change_passwd;
        if (additionalFields.status)
            userData.status = additionalFields.status;
        if (additionalFields.customFields && additionalFields.customFields.field) {
            const customFields = [];
            for (const customField of additionalFields.customFields.field) {
                customFields.push({
                    id: customField.id,
                    value: customField.value,
                });
            }
            if (customFields.length > 0) {
                userData.custom_fields = customFields;
            }
        }
        body = {
            user: userData,
        };
    }
    else if (operation === 'update') {
        const userId = this.getNodeParameter('userId', i);
        const additionalFields = this.getNodeParameter('additionalFields', i);
        method = 'PUT';
        endpoint = `/users/${userId}.json`;
        const userData = {};
        if (additionalFields.admin !== undefined)
            userData.admin = additionalFields.admin;
        if (additionalFields.auth_source_id !== undefined)
            userData.auth_source_id = additionalFields.auth_source_id;
        if (additionalFields.mail_notification !== undefined)
            userData.mail_notification = additionalFields.mail_notification;
        if (additionalFields.must_change_passwd !== undefined)
            userData.must_change_passwd = additionalFields.must_change_passwd;
        if (additionalFields.status !== undefined)
            userData.status = additionalFields.status;
        if (additionalFields.customFields && additionalFields.customFields.field) {
            const customFields = [];
            for (const customField of additionalFields.customFields.field) {
                customFields.push({
                    id: customField.id,
                    value: customField.value,
                });
            }
            if (customFields.length > 0) {
                userData.custom_fields = customFields;
            }
        }
        body = {
            user: userData,
        };
    }
    else if (operation === 'delete') {
        const userId = this.getNodeParameter('userId', i);
        method = 'DELETE';
        endpoint = `/users/${userId}.json`;
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
//# sourceMappingURL=UserExecute.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeIssueOperation = executeIssueOperation;
const n8n_workflow_1 = require("n8n-workflow");
async function executeIssueOperation(params) {
    const { operation, i, baseUrl, apiKey } = params;
    let endpoint = '';
    let method = 'GET';
    let body = {};
    let qs = {};
    if (operation === 'get') {
        const issueId = this.getNodeParameter('issueId', i);
        method = 'GET';
        endpoint = `/issues/${issueId}.json`;
        const include = this.getNodeParameter('include', i, []);
        if (include.length > 0) {
            qs.include = include.join(',');
        }
    }
    else if (operation === 'getAll') {
        const returnAll = this.getNodeParameter('returnAll', i);
        method = 'GET';
        endpoint = '/issues.json';
        if (!returnAll) {
            const limit = this.getNodeParameter('limit', i);
            const offset = this.getNodeParameter('offset', i, 0);
            qs.limit = limit;
            qs.offset = offset;
        }
        const sort = this.getNodeParameter('sort', i, '');
        if (sort) {
            qs.sort = sort;
        }
        const include = this.getNodeParameter('include', i, []);
        if (include.length > 0) {
            qs.include = include.join(',');
        }
        const filters = this.getNodeParameter('filters', i, {});
        if (filters.issue_id)
            qs.issue_id = filters.issue_id;
        if (filters.project_id)
            qs.project_id = filters.project_id;
        if (filters.subproject_id)
            qs.subproject_id = filters.subproject_id;
        if (filters.tracker_id)
            qs.tracker_id = filters.tracker_id;
        if (filters.status_id) {
            if (filters.status_id === 'custom' && filters.custom_status_id) {
                qs.status_id = filters.custom_status_id;
            }
            else {
                qs.status_id = filters.status_id;
            }
        }
        if (filters.assigned_to_id)
            qs.assigned_to_id = filters.assigned_to_id;
        if (filters.parent_id)
            qs.parent_id = filters.parent_id;
        if (filters.author_id)
            qs.author_id = filters.author_id;
        if (filters.priority_id)
            qs.priority_id = filters.priority_id;
        if (filters.category_id)
            qs.category_id = filters.category_id;
        if (filters.fixed_version_id)
            qs.fixed_version_id = filters.fixed_version_id;
        if (filters.target_version_id)
            qs.target_version_id = filters.target_version_id;
        if (filters.subject)
            qs.subject = filters.subject;
        if (filters.filterByCreationDate) {
            const filterType = filters.creationDateFilterType;
            switch (filterType) {
                case 'exact':
                    if (filters.creationDate) {
                        qs.created_on = filters.creationDate;
                    }
                    break;
                case 'range':
                    if (filters.creationDateStart && filters.creationDateEnd) {
                        qs.created_on = `><${filters.creationDateStart}|${filters.creationDateEnd}`;
                    }
                    break;
                case 'after':
                    if (filters.creationDate) {
                        qs.created_on = `>=${filters.creationDate}`;
                    }
                    break;
                case 'before':
                    if (filters.creationDate) {
                        qs.created_on = `<=${filters.creationDate}`;
                    }
                    break;
            }
        }
        if (filters.filterByUpdatedDate) {
            const filterType = filters.updatedDateFilterType;
            switch (filterType) {
                case 'exact':
                    if (filters.updatedDate) {
                        qs.updated_on = filters.updatedDate;
                    }
                    break;
                case 'range':
                    if (filters.updatedDateStart && filters.updatedDateEnd) {
                        qs.updated_on = `><${filters.updatedDateStart}|${filters.updatedDateEnd}`;
                    }
                    break;
                case 'after':
                    if (filters.updatedDate) {
                        qs.updated_on = `>=${filters.updatedDate}`;
                    }
                    break;
                case 'before':
                    if (filters.updatedDate) {
                        qs.updated_on = `<=${filters.updatedDate}`;
                    }
                    break;
            }
        }
        if (filters.customFields && filters.customFields.field) {
            for (const customField of filters.customFields.field) {
                qs[`cf_${customField.id}`] = customField.value;
            }
        }
    }
    else if (operation === 'create') {
        const projectId = this.getNodeParameter('projectId', i);
        const subject = this.getNodeParameter('subject', i);
        const additionalFields = this.getNodeParameter('additionalFields', i);
        method = 'POST';
        endpoint = '/issues.json';
        const issueData = {
            project_id: projectId,
            subject,
        };
        if (additionalFields.description)
            issueData.description = additionalFields.description;
        if (additionalFields.category_id)
            issueData.category_id = additionalFields.category_id;
        if (additionalFields.status_id)
            issueData.status_id = additionalFields.status_id;
        if (additionalFields.tracker_id)
            issueData.tracker_id = additionalFields.tracker_id;
        if (additionalFields.priority_id)
            issueData.priority_id = additionalFields.priority_id;
        if (additionalFields.assigned_to_id)
            issueData.assigned_to_id = additionalFields.assigned_to_id;
        if (additionalFields.parent_issue_id)
            issueData.parent_issue_id = additionalFields.parent_issue_id;
        if (additionalFields.fixed_version_id)
            issueData.fixed_version_id = additionalFields.fixed_version_id;
        if (additionalFields.start_date)
            issueData.start_date = additionalFields.start_date;
        if (additionalFields.due_date)
            issueData.due_date = additionalFields.due_date;
        if (additionalFields.estimated_hours)
            issueData.estimated_hours = additionalFields.estimated_hours;
        if (additionalFields.customFields && additionalFields.customFields.field) {
            const customFields = [];
            for (const customField of additionalFields.customFields.field) {
                customFields.push({
                    id: customField.id,
                    value: customField.value,
                });
            }
            if (customFields.length > 0) {
                issueData.custom_fields = customFields;
            }
        }
        body = {
            issue: issueData,
        };
    }
    else if (operation === 'update') {
        const issueId = this.getNodeParameter('issueId', i);
        const subject = this.getNodeParameter('subject', i);
        const notes = this.getNodeParameter('notes', i);
        const privateNotes = this.getNodeParameter('private_notes', i);
        const additionalFields = this.getNodeParameter('additionalFields', i);
        method = 'PUT';
        endpoint = `/issues/${issueId}.json`;
        const issueData = {};
        if (subject)
            issueData.subject = subject;
        if (notes)
            issueData.notes = notes;
        if (privateNotes)
            issueData.private_notes = true;
        if (additionalFields.description)
            issueData.description = additionalFields.description;
        if (additionalFields.category_id)
            issueData.category_id = additionalFields.category_id;
        if (additionalFields.status_id)
            issueData.status_id = additionalFields.status_id;
        if (additionalFields.tracker_id)
            issueData.tracker_id = additionalFields.tracker_id;
        if (additionalFields.priority_id)
            issueData.priority_id = additionalFields.priority_id;
        if (additionalFields.assigned_to_id)
            issueData.assigned_to_id = additionalFields.assigned_to_id;
        if (additionalFields.parent_issue_id)
            issueData.parent_issue_id = additionalFields.parent_issue_id;
        if (additionalFields.fixed_version_id)
            issueData.fixed_version_id = additionalFields.fixed_version_id;
        if (additionalFields.start_date)
            issueData.start_date = additionalFields.start_date;
        if (additionalFields.due_date)
            issueData.due_date = additionalFields.due_date;
        if (additionalFields.estimated_hours)
            issueData.estimated_hours = additionalFields.estimated_hours;
        if (additionalFields.customFields && additionalFields.customFields.field) {
            const customFields = [];
            for (const customField of additionalFields.customFields.field) {
                customFields.push({
                    id: customField.id,
                    value: customField.value,
                });
            }
            if (customFields.length > 0) {
                issueData.custom_fields = customFields;
            }
        }
        body = {
            issue: issueData,
        };
    }
    else if (operation === 'delete') {
        const issueId = this.getNodeParameter('issueId', i);
        method = 'DELETE';
        endpoint = `/issues/${issueId}.json`;
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
//# sourceMappingURL=IssueExecute.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redmine = void 0;
const IssueOperations_1 = require("./IssueOperations");
const IssueExecute_1 = require("./IssueExecute");
const ProjectOperations_1 = require("./ProjectOperations");
const ProjectExecute_1 = require("./ProjectExecute");
const UserOperations_1 = require("./UserOperations");
const UserExecute_1 = require("./UserExecute");
class Redmine {
    constructor() {
        this.description = {
            displayName: 'Redmine',
            name: 'redmine',
            icon: 'file:redmine.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Consume Redmine API',
            defaults: {
                name: 'Redmine',
            },
            inputs: ["main"],
            outputs: ["main"],
            credentials: [
                {
                    name: 'redmineApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    options: [
                        {
                            name: 'Issue',
                            value: 'issue',
                        },
                        {
                            name: 'Project',
                            value: 'project',
                        },
                        {
                            name: 'User',
                            value: 'user',
                        },
                    ],
                    default: 'issue',
                    noDataExpression: true,
                    required: true,
                },
                ...IssueOperations_1.issueOperations,
                ...IssueOperations_1.issueFields,
                ...ProjectOperations_1.projectOperations,
                ...ProjectOperations_1.projectFields,
                ...UserOperations_1.userOperations,
                ...UserOperations_1.userFields,
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('redmineApi');
        const baseUrl = credentials.url;
        const apiKey = credentials.apiKey;
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'issue') {
                    const result = await IssueExecute_1.executeIssueOperation.call(this, {
                        operation,
                        i,
                        baseUrl,
                        apiKey
                    });
                    returnData.push(result);
                }
                else if (resource === 'project') {
                    const result = await ProjectExecute_1.executeProjectOperation.call(this, {
                        operation,
                        i,
                        baseUrl,
                        apiKey
                    });
                    returnData.push(result);
                }
                else if (resource === 'user') {
                    const result = await UserExecute_1.executeUserOperation.call(this, {
                        operation,
                        i,
                        baseUrl,
                        apiKey
                    });
                    returnData.push(result);
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        pairedItem: {
                            item: i,
                        },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.Redmine = Redmine;
//# sourceMappingURL=Redmine.node.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedmineApi = void 0;
class RedmineApi {
    constructor() {
        this.name = 'redmineApi';
        this.displayName = 'Redmine API';
        this.documentationUrl = 'https://www.redmine.org/projects/redmine/wiki/Rest_api';
        this.properties = [
            {
                displayName: 'URL',
                name: 'url',
                type: 'string',
                default: '',
                placeholder: 'https://your-redmine-instance.com',
                required: true,
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                default: '',
                typeOptions: {
                    password: true,
                },
                required: true,
                description: 'API key found in your Redmine account (My account > API access key)',
            },
        ];
    }
}
exports.RedmineApi = RedmineApi;
//# sourceMappingURL=RedmineApi.credentials.js.map
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
interface IssueOperationParams {
    operation: string;
    i: number;
    baseUrl: string;
    apiKey: string;
}
export declare function executeIssueOperation(this: IExecuteFunctions, params: IssueOperationParams): Promise<INodeExecutionData>;
export {};

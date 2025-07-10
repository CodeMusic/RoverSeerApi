import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
interface UserOperationParams {
    operation: string;
    i: number;
    baseUrl: string;
    apiKey: string;
}
export declare function executeUserOperation(this: IExecuteFunctions, params: UserOperationParams): Promise<INodeExecutionData>;
export {};

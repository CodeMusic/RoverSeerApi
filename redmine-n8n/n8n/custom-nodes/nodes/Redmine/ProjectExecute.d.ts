import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
interface ProjectOperationParams {
    operation: string;
    i: number;
    baseUrl: string;
    apiKey: string;
}
export declare function executeProjectOperation(this: IExecuteFunctions, params: ProjectOperationParams): Promise<INodeExecutionData>;
export {};

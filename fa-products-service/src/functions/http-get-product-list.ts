import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AppConfigurationClient } from '@azure/app-configuration';
import { PRODUCTS_MOCK } from "./producs.mock";

export async function httpGetProductList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    const connection_string = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
    const client = new AppConfigurationClient(connection_string);
    const allConfigs = client.listConfigurationSettings();

    context.log(`allConfigs `, allConfigs);

    const configs = await client.getConfigurationSetting({ key: 'DATA_FROM_APP_CONFIG' });

    return {  jsonBody: PRODUCTS_MOCK };
}

app.http('httpGetProductList', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products',
    handler: httpGetProductList
});

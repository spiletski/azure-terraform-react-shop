import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AppConfigurationClient } from '@azure/app-configuration';

export async function httpGetProductList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const connection_string = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
    const client = new AppConfigurationClient(connection_string);
    const { value } = await client.getConfigurationSetting({ key: "DATA_FROM_APP_CONFIG" });

    return {  status: 200,  jsonBody: JSON.parse(value) };
}

app.http('http-get-product-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products',
    handler: httpGetProductList
});

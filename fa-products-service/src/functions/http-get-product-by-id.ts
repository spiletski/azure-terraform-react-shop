import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AppConfigurationClient } from "@azure/app-configuration";

export async function httpGetProductById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const { productId } = request.params;

    const connection_string = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
    const client = new AppConfigurationClient(connection_string);
    const { value } = await client.getConfigurationSetting({ key: "DATA_FROM_APP_CONFIG" });
    const product = JSON.parse(value).find(({ id }) => productId === id);

    return product ? { status: 200, jsonBody: {...product}} : { status: 404, body: 'Product not found' };
}

app.http('http-get-product-by-id', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'products/{productId}',
    handler: httpGetProductById
});

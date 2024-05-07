import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../db/connections";

export async function httpGetProductsTotal(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log(`Http function processed request for url "${request.url}"`);

        const [_, stocksContainer] = await getContainers(context);
        const queryTotal = `SELECT VALUE SUM(c.count) FROM stocks c`;
        const { resources: stocks } = await stocksContainer.items.query(queryTotal).fetchAll();

        return {
            status: 201,
            body: `Total stocks is ${stocks}`,
        }
    } catch (error) {
        context.error("Error during creating a new product:", error);

        return {
            status: 500,
            body: "Internal server error",
        };
    }

}

app.http('http-get-products-total', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'product/total',
    handler: httpGetProductsTotal
});

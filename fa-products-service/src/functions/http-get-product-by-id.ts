import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../db/connections";

export async function httpGetProductById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const { productId } = request.params;
    context.log(`Product id: `, productId);

    const [productsContainer, stocksContainer] = await getContainers(context);

    const queryProduct = `SELECT * FROM c WHERE c.id = '${productId}'`;
    const { resources: products } = await productsContainer.items.query(queryProduct).fetchAll();
    const product = products[0];

    if(!product) return { status: 404, body: `Product with id ${productId} not found` };

    const queryStock = `SELECT * FROM c WHERE c.product_id = '${productId}'`;
    const { resources: stocks } = await stocksContainer.items.query(queryStock).fetchAll();
    const stock = stocks[0];

    if(!stock) return { status: 404, body: `Product with id ${productId} not found` };

    const count = stock?.count ?? 0;
    return { status: 200, jsonBody: {...product, stock: count }};
}

app.http('http-get-product-by-id', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products/{productId:guid}',
    handler: httpGetProductById
});

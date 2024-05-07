import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../db/connections";

export async function httpGetProductList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const [productsContainer, stocksContainer] = await getContainers(context);

    const  { resources: products } = await productsContainer.items.readAll().fetchAll();
    const { resources: stocks } = await stocksContainer.items.readAll().fetchAll();

    const productsWithStocks = products.map((product) => {
        const productWithStock  = stocks.find(stock => product.id === stock.product_id);
        return {
            ...product,
            stocks: productWithStock?.count ?? 0,
        }
    })

    return {  status: 200,  jsonBody: productsWithStocks };
}

app.http('http-get-product-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products',
    handler: httpGetProductList
});

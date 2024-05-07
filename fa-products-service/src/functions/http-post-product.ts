import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from 'uuid';
import { getContainers } from "../db/connections";

export async function httpPostProduct(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log(`Http function processed request for url "${request.url}"`);

        const textBody = await request.text();
        context.log(`Request data: `, textBody);

        const parsedBody = JSON.parse(textBody)

        if(parsedBody?.title && parsedBody?.description && parsedBody?.price && parsedBody?.count) {
            const [productsContainer, stocksContainer] = await getContainers(context);

            const { statusCode: pStatusCode, item: pItem, resource: newProduct} = await productsContainer.items.create({
                id: uuidv4(),
                title:  parsedBody?.title,
                description: parsedBody?.description,
                price: 1,
            });

            const { statusCode: sStatusCode, item: sItem, resource: newStock} = await stocksContainer.items.create({
                product_id:  newProduct?.id,
                count:  parsedBody?.count,
            });

            return {
                status: 201,
                jsonBody: { newProduct, newStock },
            };
        } else {
            return {
                status: 400,
                body: "Please provide correct data for creating a product.",
            };
        }


    } catch (error) {
        context.error("Error during creating a new product:", error);

        return {
            status: 500,
            body: "Internal server error",
        };
    }

}

app.http('http-post-product', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'products',
    handler: httpPostProduct
});

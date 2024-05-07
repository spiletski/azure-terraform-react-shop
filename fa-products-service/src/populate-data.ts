import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import { PRODUCTS_MOCK } from "./functions/products.mock";

const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY;
const cosmosDbName = 'products-db';
const cosmosProductsContainer = 'products';
const cosmosStocksContainer = 'stocks';

export async function populateData()  {
  const client = new CosmosClient({
    endpoint: endpoint,
    key: key
  });

  const database = client.database(cosmosDbName);
  const productsContainer = database.container(cosmosProductsContainer);
  const stocksContainer = database.container(cosmosStocksContainer);

  for(let i= 0; i < PRODUCTS_MOCK.length; i++) {
    let id = uuidv4();
    let product = {
    ...PRODUCTS_MOCK[i],
        id: id,
    };
    let stock = {
      product_id: id,
      count: i * 10,
    };

    await productsContainer.items.create(product);
    await stocksContainer.items.create(stock);
  }
}

populateData();
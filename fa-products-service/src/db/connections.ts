import { AppConfigurationClient } from "@azure/app-configuration";
import { CosmosClient } from "@azure/cosmos";
import { InvocationContext } from "@azure/functions";

export const getClient = async (context: InvocationContext): Promise<CosmosClient> => {
    const connection_string = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
    const appConfig = new AppConfigurationClient(connection_string);

    const { value: cosmosEndpoint } = await appConfig.getConfigurationSetting({ key: "COSMOS_ENDPOINT" });
    const { value: cosmosKey } = await appConfig.getConfigurationSetting({ key: "COSMOS_KEY" });

    const client = new CosmosClient({
      endpoint: cosmosEndpoint,
      key: cosmosKey
    });

    return client;
};

export const getDatabase = async (context: InvocationContext, cosmosDbName: string) => {
   const client = await getClient(context);

  return client.database(cosmosDbName);
}

export const getContainers = async (context: InvocationContext) => {

  const cosmosDbName = 'products-db';
  const cosmosProductsContainer = 'products';
  const cosmosStocksContainer = 'stocks';

  const db = await getDatabase(context, cosmosDbName);

  const productsContainer = db.container(cosmosProductsContainer);
  const stocksContainer = db.container(cosmosStocksContainer);


  return [productsContainer, stocksContainer];
}
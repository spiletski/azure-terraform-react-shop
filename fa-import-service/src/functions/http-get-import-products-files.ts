import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
    BlobSASPermissions,
    BlobServiceClient, BlockBlobClient,
    ContainerClient,
    generateBlobSASQueryParameters, StorageSharedKeyCredential
} from "@azure/storage-blob";

function getBlobSasUri(blockBlobClient: BlockBlobClient, blobName: string, sharedKeyCredential: StorageSharedKeyCredential) {
    const sasOptions = {
        containerName: blockBlobClient.containerName,
        blobName: blobName,
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
        permissions: BlobSASPermissions.parse("rw"),
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    console.log(`SAS token for blob is: ${sasToken}`);

    return `${blockBlobClient.url}?${sasToken}`;
}

export async function httpGetImportProductsFiles(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const fileName = request.query.get('name');

    const STORAGE_CONNECTION_STRING = process.env?.STORAGE_CONNECTION_STRING;
    const STORAGE_CONTAINER_NAME = process.env?.STORAGE_CONTAINER_NAME;
    const STORAGE_ACCOUNT_KEY = process.env?.STORAGE_ACCOUNT_KEY;

    const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(STORAGE_CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      blockBlobClient.containerName,
      STORAGE_ACCOUNT_KEY,
    );

    const sasUri = getBlobSasUri(blockBlobClient, fileName, sharedKeyCredential);

    return { body: sasUri };
}

app.http('http-get-import-products-files', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'import',
    handler: httpGetImportProductsFiles
});

import { app, InvocationContext } from "@azure/functions";

export async function blobImportProductsFromFile(blob: Buffer, context: InvocationContext): Promise<void> {
    context.log(`Storage blob function processed blob "${context.triggerMetadata.name}" with size ${blob.length} bytes`);
}

app.storageBlob('blob-import-products-from-file', {
    path: 'uploaded',
    connection: 'STORAGE_CONNECTION_STRING',
    handler: blobImportProductsFromFile
});

import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { HttpRequest } from "@aws-sdk/protocol-http";

const type = "_doc";
const domain = process.env.OS_DOMAIN!;
const index = process.env.OS_INDEX_NAME;
const region = process.env.OS_AWS_REGION!;

export interface Transaction {
  pk: string;
  sk: string;
}

export async function deleteIndex(): Promise<void> {
  const request = new HttpRequest({
    headers: {
      "Content-Type": "application/json",
      host: domain,
    },
    hostname: domain,
    method: "DELETE",
    path: index,
  });

  await execute(request);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const request = new HttpRequest({
    headers: {
      "Content-Type": "application/json",
      host: domain,
    },
    hostname: domain,
    method: "DELETE",
    path: `${index}/${type}/${documentId}`,
  });

  await execute(request);
}

export async function indexDocument(
  documentId: string,
  document: Transaction
): Promise<void> {
  const request = new HttpRequest({
    body: JSON.stringify(document),
    headers: {
      "Content-Type": "application/json",
      host: domain,
    },
    hostname: domain,
    method: "PUT",
    path: `${index}/${type}/${documentId}`,
  });

  await execute(request);
}

async function execute(request: HttpRequest): Promise<void> {
  const awsOpenSearchSigner = new SignatureV4({
    credentials: defaultProvider(),
    region,
    service: "es",
    sha256: Sha256,
  });

  try {
    const signedRequest = await awsOpenSearchSigner.sign(request);
    const awsNodeHttpClient = new NodeHttpHandler();

    const { response } = await awsNodeHttpClient.handle(
      <HttpRequest>signedRequest
    );
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log(
        "Successfully sent request to OpenSearch Domain. Response code:",
        response.statusCode
      );
    } else {
      console.error(
        "Error occurred with request to OpenSearch Domain. Response code:",
        response.statusCode
      );
    }
  } catch (error) {
    console.error(
      "Error occurred trying to make request to OpenSearch Domain",
      error
    );
    throw error;
  }
}

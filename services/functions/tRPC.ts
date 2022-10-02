import * as trpc from "@trpc/server";
import { z } from "zod";
import {
  awsLambdaRequestHandler,
  CreateAWSLambdaContextOptions,
} from "@trpc/server/adapters/aws-lambda";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getTransactions } from "../core/opensearch";
import { deleteTransaction } from "../core/dynamodb";

// export type definition of API
export type AppRouter = typeof appRouter;

const appRouter = trpc
  .router()
  .query("getTransactions", {
    input: z.object({
      customer_id: z.string(),
      search_fields: z.array(z.object({ key: z.string(), value: z.string() })),
      operator: z.string(),
      sorting: z.optional(
        z.object({
          column: z.string(),
          descending: z.string(),
          isNumber: z.boolean(),
        })
      ),
      paging: z.object({
        pageSize: z.number(),
        from: z.number(),
      }),
    }),
    async resolve(req) {
      return getTransactions(
        req.input.customer_id,
        req.input.search_fields,
        req.input.operator,
        req.input.paging,
        req.input.sorting
      );
    },
  })
  .mutation("deleteTransaction", {
    input: z.object({
      pk: z.string(),
      sk: z.string(),
    }),
    async resolve(req) {
      // Delete from DB
      return deleteTransaction(req.input.pk, req.input.sk);
    },
  });

const createContext = ({
  event,
  context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => {
  return {};
};

export const handler = awsLambdaRequestHandler({
  router: appRouter,
  createContext,
});

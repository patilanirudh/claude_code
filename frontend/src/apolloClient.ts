import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const GRAPHQL_HTTP_URL =
  (import.meta.env.VITE_GRAPHQL_URL as string) || "http://localhost:8000/graphql";
const GRAPHQL_WS_URL = GRAPHQL_HTTP_URL.replace(/^http/, "ws");

const httpLink = new HttpLink({ uri: GRAPHQL_HTTP_URL });

const wsLink = new GraphQLWsLink(createClient({ url: GRAPHQL_WS_URL }));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

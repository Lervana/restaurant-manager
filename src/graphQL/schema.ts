import { buildSchema, GraphQLSchema } from "graphql";

const schema: GraphQLSchema = buildSchema(`
  type Query {
    hello: String
  }
`);

export default schema;

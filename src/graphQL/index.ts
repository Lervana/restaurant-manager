import { NonEmptyArray } from "type-graphql";
import { DishResolver } from "./resolvers/DishResolver";

export const resolvers: NonEmptyArray<Function> = [DishResolver];

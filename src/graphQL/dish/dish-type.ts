import { Field, ObjectType, Int, Float, ID } from "type-graphql";

@ObjectType({ description: "Object representing menu position" })
export class Dish {
  @Field((type) => ID)
  id!: string;

  @Field()
  category!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field((type) => Float)
  price_pln!: Number;

  @Field()
  created!: Date;

  @Field()
  updated!: Date;
}

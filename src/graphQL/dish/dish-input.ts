import { MaxLength, Min } from "class-validator";
import { InputType, Field } from "type-graphql";

import { Dish } from "./dish-type";

@InputType()
export class DishInput implements Partial<Dish> {
  @Field()
  @MaxLength(30)
  category!: string;

  @Field()
  @MaxLength(100)
  name!: string;

  @Field({ nullable: true })
  @MaxLength(500)
  description?: string;

  @Field()
  @Min(0)
  price!: number;
}

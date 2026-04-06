export class CreateOrderDto {
  userId: number;
  items: OrderItemDto[];
}

export class OrderItemDto {
  foodId: string;
  quantity: number;
}

export interface OrderItem {
  foodId: number;
  foodName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  userId: number;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

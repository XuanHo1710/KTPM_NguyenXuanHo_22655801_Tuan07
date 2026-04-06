"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { foodService, Food } from "@/services/foodService";
import { orderService, Order } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";

type CartItem = { food: Food; quantity: number };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadFoods = useCallback(async () => {
    try {
      const data = await foodService.getAll();
      setFoods(Array.isArray(data) ? data : []);
    } catch { showToast("Không thể tải danh sách món ăn", "error"); }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const data = await orderService.getAll();
      setOrders(Array.isArray(data) ? data.reverse() : []);
    } catch { showToast("Không thể tải đơn hàng", "error"); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) { try { setUser(JSON.parse(userData)); } catch {} }
    Promise.all([loadFoods(), loadOrders()]).finally(() => setLoading(false));
  }, [router, loadFoods, loadOrders]);

  const addToCart = (food: Food) => {
    setCart(prev => {
      const exist = prev.find(c => c.food._id === food._id);
      if (exist) return prev.map(c => c.food._id === food._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { food, quantity: 1 }];
    });
  };

  const removeFromCart = (foodId: string) => setCart(prev => prev.filter(c => c.food._id !== foodId));

  const updateQty = (foodId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(foodId); return; }
    setCart(prev => prev.map(c => c.food._id === foodId ? { ...c, quantity: qty } : c));
  };

  const cartTotal = cart.reduce((s, c) => s + c.food.price * c.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrderLoading(true);
    try {
      await orderService.create({
        userId: 1,
        items: cart.map(c => ({ foodId: c.food._id, quantity: c.quantity })),
      });
      showToast("🎉 Đặt hàng thành công!");
      setCart([]);
      await loadOrders();
      setActiveTab("orders");
    } catch (e: any) {
      showToast(e.message || "Đặt hàng thất bại", "error");
    } finally { setOrderLoading(false); }
  };

  // PayOS: Tạo link thanh toán thật → redirect sang PayOS
  const payOrder = async (order: Order) => {
    setPayingOrderId(order._id);
    try {
      const result = await paymentService.create({
        orderId: order._id,
        customerEmail: user?.email || "test@test.com",
        description: `Don hang ${order._id.substring(0, 8)}`,
      });

      if (result.success && result.data?.checkoutUrl) {
        // Redirect sang trang thanh toán PayOS
        showToast("🔗 Đang chuyển đến trang thanh toán PayOS...");
        setTimeout(() => {
          window.location.href = result.data!.checkoutUrl!;
        }, 1000);
      } else if (result.success) {
        // Fallback: thanh toán trực tiếp
        showToast(`✅ ${result.message}`);
        await loadOrders();
      } else {
        showToast(result.message || "Thanh toán thất bại", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Thanh toán thất bại", "error");
    } finally { setPayingOrderId(null); }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="dash">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <header className="dash-header">
        <div className="dash-header-left">
          <h1>🍔 Food Order</h1>
          <span className="dash-user">Xin chào, <b>{user?.username || "Guest"}</b></span>
        </div>
        <div className="dash-header-right">
          <button className="tab-btn" data-active={activeTab === "menu"} onClick={() => setActiveTab("menu")}>
            🍽️ Thực đơn
          </button>
          <button className="tab-btn" data-active={activeTab === "orders"} onClick={() => { setActiveTab("orders"); loadOrders(); }}>
            📋 Đơn hàng ({orders.length})
          </button>
          <button className="logout-btn" onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      <div className="dash-body">
        {activeTab === "menu" ? (
          <>
            <section className="dash-main">
              <h2>Thực đơn ({foods.length} món)</h2>
              <div className="food-grid">
                {foods.map(food => (
                  <div key={food._id} className="food-card">
                    <div className="food-emoji">🍜</div>
                    <div className="food-info">
                      <h3>{food.name}</h3>
                      {food.description && <p className="food-desc">{food.description}</p>}
                      <div className="food-bottom">
                        <span className="food-price">{fmt(food.price)}</span>
                        <button className="add-btn" onClick={() => addToCart(food)}>+ Thêm</button>
                      </div>
                    </div>
                  </div>
                ))}
                {foods.length === 0 && <p className="empty-text">Chưa có món ăn nào.</p>}
              </div>
            </section>

            <aside className="cart-sidebar">
              <h2>🛒 Giỏ hàng ({cart.length})</h2>
              {cart.length === 0 ? (
                <p className="empty-text">Giỏ hàng trống</p>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.food._id} className="cart-item">
                        <div className="cart-item-info">
                          <span className="cart-item-name">{item.food.name}</span>
                          <span className="cart-item-price">{fmt(item.food.price)}</span>
                        </div>
                        <div className="cart-item-actions">
                          <button className="qty-btn" onClick={() => updateQty(item.food._id, item.quantity - 1)}>−</button>
                          <span className="qty-num">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQty(item.food._id, item.quantity + 1)}>+</button>
                          <button className="remove-btn" onClick={() => removeFromCart(item.food._id)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="cart-total">
                    <span>Tổng cộng:</span>
                    <span className="cart-total-price">{fmt(cartTotal)}</span>
                  </div>
                  <button className="order-btn" onClick={placeOrder} disabled={orderLoading}>
                    {orderLoading ? "Đang đặt..." : "🛒 Đặt hàng"}
                  </button>
                </>
              )}
            </aside>
          </>
        ) : (
          <section className="orders-section">
            <h2>Đơn hàng của bạn</h2>
            {orders.length === 0 ? (
              <p className="empty-text">Chưa có đơn hàng nào.</p>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <span className="order-id">Đơn #{order._id.substring(0, 8)}</span>
                      <span className={`order-status status-${order.status?.toLowerCase()}`}>
                        {order.status === "PAID" ? "✅ Đã thanh toán" : order.status === "PENDING" ? "⏳ Chờ thanh toán" : order.status}
                      </span>
                    </div>
                    <div className="order-items">
                      {order.items?.map((item, i) => (
                        <div key={i} className="order-item-row">
                          <span>{item.foodName} x{item.quantity}</span>
                          <span>{fmt(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <span className="order-total">Tổng: <b>{fmt(order.totalAmount)}</b></span>
                      {order.status === "PENDING" && (
                        <button
                          className="pay-btn"
                          onClick={() => payOrder(order)}
                          disabled={payingOrderId === order._id}
                        >
                          {payingOrderId === order._id ? "Đang xử lý..." : "💳 Thanh toán PayOS"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

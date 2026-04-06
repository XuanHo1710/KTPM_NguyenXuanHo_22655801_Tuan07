"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { paymentService } from "@/services/paymentService";

export default function PaymentInfoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "cancel" | "error">("loading");
  const [message, setMessage] = useState("");
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    const payosStatus = searchParams.get("status");
    const cancel = searchParams.get("cancel");

    if (cancel === "true" || payosStatus === "CANCELLED") {
      setStatus("cancel");
      setMessage("Bạn đã hủy thanh toán.");
      return;
    }

    if (!orderCode) {
      setStatus("error");
      setMessage("Không tìm thấy thông tin thanh toán.");
      return;
    }

    // Verify payment via backend
    paymentService.verify(parseInt(orderCode))
      .then((result) => {
        if (result.success) {
          setStatus("success");
          setMessage(result.message || "Thanh toán thành công!");
          setPaymentData(result.payment);
        } else {
          setStatus(result.status === "CANCELLED" ? "cancel" : "error");
          setMessage(result.message || "Thanh toán chưa thành công");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Không thể xác nhận thanh toán.");
      });
  }, [searchParams]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="payment-result-card">
          {status === "loading" && (
            <div className="payment-loading">
              <div className="spinner" />
              <p>Đang xác nhận thanh toán...</p>
            </div>
          )}

          {status === "success" && (
            <div className="payment-success">
              <div className="payment-icon">✅</div>
              <h2>Thanh toán thành công!</h2>
              <p>{message}</p>
              {paymentData && (
                <div className="payment-details">
                  <div className="detail-row">
                    <span>Mã thanh toán:</span>
                    <span>#{paymentData.paymentCode}</span>
                  </div>
                  <div className="detail-row">
                    <span>Đơn hàng:</span>
                    <span>#{paymentData.orderId?.substring(0, 8)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Số tiền:</span>
                    <span className="amount">{fmt(paymentData.amount || 0)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Trạng thái:</span>
                    <span className="status-badge paid">Đã thanh toán</span>
                  </div>
                </div>
              )}
              <button className="submit-btn" onClick={() => router.push("/dashboard")}>
                ← Về trang chủ
              </button>
            </div>
          )}

          {status === "cancel" && (
            <div className="payment-cancel">
              <div className="payment-icon">❌</div>
              <h2>Thanh toán bị hủy</h2>
              <p>{message}</p>
              <button className="submit-btn" onClick={() => router.push("/dashboard")}>
                ← Quay lại đặt hàng
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="payment-error">
              <div className="payment-icon">⚠️</div>
              <h2>Có lỗi xảy ra</h2>
              <p>{message}</p>
              <button className="submit-btn" onClick={() => router.push("/dashboard")}>
                ← Quay lại
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

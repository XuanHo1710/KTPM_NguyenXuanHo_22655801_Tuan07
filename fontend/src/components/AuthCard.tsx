"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authService, ApiError } from "@/services/authService";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

type AuthCardProps = {
  mode: AuthMode;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthCard({ mode }: AuthCardProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessageType("error");
      setMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setMessageType("error");
      setMessage("Email không đúng định dạng.");
      return;
    }

    if (isRegister && !name.trim()) {
      setMessageType("error");
      setMessage("Vui lòng nhập tên người dùng.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        const result = await authService.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        setMessageType("ok");
        setMessage(result.message || "Đăng ký thành công.");
      } else {
        const result = await authService.login({
          email: email.trim(),
          password,
        });

        if (result.accessToken) {
          localStorage.setItem("accessToken", result.accessToken);
        }
        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }

        setMessageType("ok");
        setMessage(result.message || "Đăng nhập thành công.");

        // Redirect to dashboard after login
        setTimeout(() => router.push("/dashboard"), 800);
      }
    } catch (error) {
      setMessageType("error");

      if (error instanceof ApiError) {
        setMessage(error.message);
      } else if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="card">
          <div className="card-head">
            <h2>{isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}</h2>
            <p>
              {isRegister
                ? "Tạo tài khoản mới để bắt đầu đặt món"
                : "Chào mừng bạn quay trở lại"}
            </p>
          </div>

          <div className="tabs">
            <Link href="/login" className={!isRegister ? "tab active" : "tab"}>
              Đăng nhập
            </Link>
            <Link href="/register" className={isRegister ? "tab active" : "tab"}>
              Đăng ký
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            {isRegister && (
              <label className="field">
                <span>Tên người dùng</span>
                <div className="input-wrap">
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nhập tên người dùng"
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <div className="input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhập email"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="field">
              <span>Mật khẩu</span>
              <div className="input-wrap">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
              </div>
            </label>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting
                ? "Đang xử lý..."
                : isRegister
                  ? "Đăng ký"
                  : "Đăng nhập"}
            </button>

            {message ? (
              <p className={messageType === "ok" ? "message ok" : "message error"}>
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}

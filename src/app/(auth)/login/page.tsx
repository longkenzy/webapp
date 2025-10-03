"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Notification from "@/components/shared/common/Notification";

function LoginForm() {
  const search = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'error' | 'warning'>('error');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Redirect based on user role after successful login
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userRole = (session.user as { role?: string }).role;
      const callbackUrl = search.get("from");
      
      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (userRole === "ADMIN" || userRole === "IT_LEAD" || userRole === "IT_STAFF") {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    }
  }, [session, status, router, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Direct sign in with NextAuth - it will handle all validation
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        // Handle specific error cases
        if (result.error === 'ACCOUNT_INACTIVE') {
          setNotificationType('warning');
          setNotificationMessage('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
          setShowNotification(true);
          setError("Tài khoản đã bị khóa");
        } else {
          setError("Email hoặc mật khẩu không đúng");
        }
      }
      // Don't redirect here - let useEffect handle it based on session
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <>
      {showNotification && (
        <Notification
          type={notificationType}
          message={notificationMessage}
          duration={5000}
          onClose={() => setShowNotification(false)}
        />
      )}
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 p-4 md:p-8 relative overflow-hidden">
        {/* Main Container */}
        <div className="w-full max-w-md md:max-w-5xl relative z-10">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left Side - Branding (Desktop Only) */}
              <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-400 text-white relative overflow-hidden">
                {/* Geometric Shapes */}
                <div className="absolute inset-0 overflow-hidden">
                  {/* Diagonal lines */}
                  <div className="absolute top-20 left-10 w-32 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-lg transform -rotate-45"></div>
                  <div className="absolute top-32 left-20 w-24 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-lg transform -rotate-45"></div>
                  <div className="absolute top-40 left-32 w-40 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-lg transform -rotate-45"></div>
                  
                  <div className="absolute bottom-32 left-16 w-28 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-lg transform -rotate-45"></div>
                  <div className="absolute bottom-24 left-28 w-36 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-lg transform -rotate-45"></div>
                  <div className="absolute bottom-16 left-40 w-32 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-lg transform -rotate-45"></div>
                  
                  {/* Rounded rectangles */}
                  <div className="absolute top-24 right-16 w-20 h-32 bg-gradient-to-br from-teal-400/70 to-cyan-400/70 rounded-2xl transform rotate-45"></div>
                  <div className="absolute bottom-20 right-24 w-24 h-40 bg-gradient-to-br from-teal-400/70 to-cyan-400/70 rounded-2xl transform rotate-45"></div>
                  
                  {/* Small decorative elements */}
                  <div className="absolute top-48 left-8 w-16 h-2 bg-teal-400/60 rounded-lg transform -rotate-45"></div>
                  <div className="absolute top-56 left-16 w-12 h-2 bg-cyan-400/60 rounded-lg transform -rotate-45"></div>
                </div>
                
                <div className="relative z-10">
                  {/* Logo */}
                  <div className="mb-8">
                    <Image
                      src="/logo/logo.png"
                      alt="IT Services Management Logo"
                      width={100}
                      height={100}
                      priority
                      className="object-contain drop-shadow-2xl"
                      style={{ width: 'auto', height: 'auto' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-5xl font-bold shadow-2xl">IT</div>';
                        }
                      }}
                    />
                  </div>

                  <h1 className="text-5xl font-bold mb-6 leading-tight">
                    Welcome to<br />IT Services
                  </h1>
                  <p className="text-white/90 text-base leading-relaxed max-w-md">
                    Hệ thống quản lý dịch vụ IT toàn diện - Giúp bạn theo dõi, quản lý và giải quyết các vấn đề kỹ thuật một cách nhanh chóng và hiệu quả.
                  </p>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="flex flex-col justify-center p-8 md:p-16 bg-gradient-to-br from-gray-50 to-white">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <Image
                    src="/logo/logo.png"
                    alt="IT Services Management Logo"
                    width={80}
                    height={80}
                    priority
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">IT</div>';
                      }
                    }}
                  />
                </div>

                {/* Title */}
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-blue-600 uppercase tracking-wide mb-2">User Login</h2>
                  <div className="w-20 h-1 bg-blue-600 mx-auto rounded"></div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto w-full">
                  {/* Email/Username Field */}
                  <div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="text"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white border-b-2 border-gray-300 focus:border-cyan-500 transition-colors text-gray-900 placeholder-gray-400 outline-none"
                        placeholder="Username"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                        className="w-full pl-12 pr-12 py-3 bg-white border-b-2 border-gray-300 focus:border-cyan-500 transition-colors text-gray-900 placeholder-gray-400 outline-none"
                        placeholder="Password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-gray-600">Remember</span>
                    </label>
                    <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border-l-4 border-red-500 rounded-md animate-shake">
                      <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !formData.email || !formData.password}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 uppercase tracking-wide"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>

                {/* Register Link */}
                <div className="text-center mt-8">
                  <p className="text-gray-600 text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 p-4 md:p-8">
        <div className="w-full max-w-md md:max-w-5xl">
          <div className="bg-white rounded-xl shadow-2xl p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}



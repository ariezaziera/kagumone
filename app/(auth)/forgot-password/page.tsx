import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-3 text-sm">
      <h2 className="text-lg font-semibold text-text">Forgot your password?</h2>
      <p className="leading-relaxed text-secondary">
        Contact an administrator. They can reset your password and give you a temporary one. Sign in with that password, then choose a new one before you can continue.
      </p>
      <p>
        <Link className="text-info" href="/login">
          Back to login
        </Link>
      </p>
    </div>
  );
}

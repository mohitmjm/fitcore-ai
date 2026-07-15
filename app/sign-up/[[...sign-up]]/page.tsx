import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <div className="auth-fallback"><span>Local preview</span><h1>Account creation is not configured.</h1><p>Add the Clerk environment keys to enable real accounts. The product preview remains fully usable with local development data.</p><Link href="/today">Open Fitcore preview</Link></div>;
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}

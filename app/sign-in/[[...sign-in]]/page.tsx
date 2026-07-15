import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <div className="auth-fallback"><span>Local preview</span><h1>Authentication is not configured.</h1><p>Fitcore is running with its safe development identity. Add the Clerk environment keys to enable sign-in.</p><Link href="/today">Open Fitcore preview</Link></div>;
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}

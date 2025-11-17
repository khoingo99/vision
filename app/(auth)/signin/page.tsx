// app/(auth)/signin/page.tsx
import { Suspense } from "react";
import SignInContent from "./signin-content";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}

import { AuthForm } from "@/components/auth-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const nextPath = resolvedParams?.next || "/dashboard";

  return (
    <div className="py-8">
      <AuthForm mode="signup" nextPath={nextPath} />
    </div>
  );
}

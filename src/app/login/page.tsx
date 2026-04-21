import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const nextPath = resolvedParams?.next || "/dashboard";

  return (
    <div className="py-8">
      <AuthForm mode="login" nextPath={nextPath} />
    </div>
  );
}

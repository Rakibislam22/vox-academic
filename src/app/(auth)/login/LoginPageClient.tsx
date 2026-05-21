"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function LoginPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
    const registered = searchParams?.get("registered") === "1";
    const { status } = useSession();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
        }
    }, [router, status]);

    const onSubmit = async (values: LoginInput) => {
        const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl,
        });

        if (result?.error) {
            setError("password", { type: "manual", message: "Invalid email or password" });
            return;
        }

        window.location.assign(result?.url || callbackUrl);
    };

    const handleGoogleSignIn = () => {
        void signIn("google", { callbackUrl });
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-navy-dark via-navy-darker to-charcoal px-4 py-10 text-white sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
                <div className="grid w-full overflow-hidden rounded-4xl border border-white/10 bg-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="hidden flex-col justify-between border-r border-white/10 bg-linear-to-b from-[#09111f] to-[#07101b] p-10 lg:flex">
                        <div>
                            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                                Vox Academic
                            </span>
                            <h1 className="mt-8 max-w-md text-4xl font-semibold leading-tight text-white">
                                Sign in to continue your PDF learning workflow.
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
                                Access your PDF library, generated summaries, and dashboard tools from a single secure session.
                            </p>
                        </div>

                        <div className="grid gap-4 text-sm text-white/70">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                JWT-based session management
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                Google and email/password sign-in
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                Protected dashboard access
                            </div>
                        </div>
                    </section>

                    <section className="p-6 sm:p-8 lg:p-10">
                        <div className="mb-8 lg:hidden">
                            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                                Vox Academic
                            </span>
                            <h1 className="mt-4 text-3xl font-semibold text-white">Sign in</h1>
                            <p className="mt-2 text-sm text-white/65">Use your account or continue with Google.</p>
                        </div>

                        <div className="hidden lg:block">
                            <h2 className="text-3xl font-semibold text-white">Sign in</h2>
                            <p className="mt-2 text-sm text-white/65">Use your email and password or continue with Google.</p>
                        </div>

                        {registered && (
                            <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                Account created. Sign in with your email and password or continue automatically after signup.
                            </div>
                        )}

                        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                            <label className="form-control w-full">
                                <span className="label-text mb-2 text-sm font-medium text-white/80">Email</span>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    className="input input-bordered w-full border-white/10 bg-white/5 text-white placeholder:text-white/35"
                                    placeholder="you@example.com"
                                    {...register("email")}
                                />
                                {errors.email && <span className="mt-2 text-sm text-red-300">{errors.email.message}</span>}
                            </label>

                            <label className="form-control w-full">
                                <span className="label-text mb-2 text-sm font-medium text-white/80">Password</span>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    className="input input-bordered w-full border-white/10 bg-white/5 text-white placeholder:text-white/35"
                                    placeholder="••••••••"
                                    {...register("password")}
                                />
                                {errors.password && <span className="mt-2 text-sm text-red-300">{errors.password.message}</span>}
                            </label>

                            <button
                                type="submit"
                                className="btn btn-primary mt-2 w-full border-0 bg-linear-to-r from-cyan-500 to-sky-500 text-white hover:from-cyan-400 hover:to-sky-400"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Signing in..." : "Sign in"}
                            </button>
                        </form>

                        <div className="divider my-6 text-white/40">or</div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="btn btn-outline w-full border-white/15 bg-white/5 text-white hover:border-cyan-300 hover:bg-white/10"
                        >
                            Continue with Google
                        </button>

                        <p className="mt-6 text-center text-sm text-white/70">
                            No account yet?{" "}
                            <Link href="/signup" className="font-medium text-cyan-200 hover:text-cyan-100">
                                Create one
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

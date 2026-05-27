'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignupInput) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError('root', {
        type: 'manual',
        message: payload?.message || 'Unable to create your account',
      });
      return;
    }

    const loginResult = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    if (loginResult?.url) {
      router.push(loginResult.url);
      return;
    }

    if (!loginResult?.error) {
      router.push('/dashboard');
      return;
    }

    router.push('/login?registered=1');
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-navy-dark via-navy-darker to-charcoal px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-white/10 bg-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr]">
          <section className="hidden flex-col justify-between border-r border-white/10 bg-linear-to-b from-[#08111d] to-[#07101b] p-10 lg:flex">
            <div>
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Create account
              </span>
              <h1 className="mt-8 max-w-md text-4xl font-semibold leading-tight text-white">
                Start building your academic reading workspace.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
                Create a secure account to upload PDFs, save summaries, and return to your dashboard
                from any device.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Strong password validation with Zod
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                MongoDB-backed credential storage
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Ready for Google sign-in on the login page
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 lg:hidden">
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Create account
              </span>
              <h1 className="mt-4 text-3xl font-semibold text-white">Sign up</h1>
              <p className="mt-2 text-sm text-white/65">
                Create a new account with your name, email, and password.
              </p>
            </div>

            <div className="hidden lg:block">
              <h2 className="text-3xl font-semibold text-white">Sign up</h2>
              <p className="mt-2 text-sm text-white/65">
                Create a new account with your name, email, and password.
              </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="form-control w-full">
                <span className="label-text mb-2 text-sm font-medium text-white/80">Name</span>
                <input
                  type="text"
                  autoComplete="name"
                  className="input input-bordered w-full border-white/10 bg-white/5 text-white placeholder:text-white/35"
                  placeholder="Jane Doe"
                  {...register('name')}
                />
                {errors.name && (
                  <span className="mt-2 text-sm text-red-300">{errors.name.message}</span>
                )}
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-2 text-sm font-medium text-white/80">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  className="input input-bordered w-full border-white/10 bg-white/5 text-white placeholder:text-white/35"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <span className="mt-2 text-sm text-red-300">{errors.email.message}</span>
                )}
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-2 text-sm font-medium text-white/80">Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input input-bordered w-full border-white/10 bg-white/5 text-white placeholder:text-white/35"
                  placeholder="At least 8 characters"
                  {...register('password')}
                />
                {errors.password && (
                  <span className="mt-2 text-sm text-red-300">{errors.password.message}</span>
                )}
              </label>

              {errors.root && <p className="text-sm text-red-300">{errors.root.message}</p>}

              <button
                type="submit"
                className="btn btn-primary mt-2 w-full border-0 bg-linear-to-r from-cyan-500 to-sky-500 text-white hover:from-cyan-400 hover:to-sky-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/70">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-cyan-200 hover:text-cyan-100">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

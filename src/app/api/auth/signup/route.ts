import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations/auth';
import { createCredentialsUser } from '../../../../lib/user-store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid signup data', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await createCredentialsUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      provider: 'credentials',
    });

    return NextResponse.json(
      {
        message: 'Account created',
        user: {
          id: 'id' in user ? user.id : user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

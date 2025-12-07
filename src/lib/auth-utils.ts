import type { Session } from 'next-auth';

export function isAuthenticated(session: Session | null): session is Session & { user: { email: string } } {
  return !!session?.user?.email;
}

/* USO:
import { isAuthenticated } from '@/lib/auth-utils';

const session = await getServerSession(authOptions);
if (!isAuthenticated(session)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Agora session.user.email é garantido não-null
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
});
*/
/**
 * TrafficGenius — Auth Layout
 *
 * Minimal layout for authentication pages (no dashboard nav).
 */

export const metadata = {
  title: "Sign In — TrafficGenius",
  description: "Sign in to the TrafficGenius security dashboard",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

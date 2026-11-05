import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Lomax Builders | A home, entirely yours.",
  description:
    "Your next chapter starts here. Tell Lomax Builders about your custom home, renovation, or home addition.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

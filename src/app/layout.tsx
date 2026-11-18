import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NexaDB — Database Console",
  description: "Private PostgreSQL management console"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}

import "./globals.css";
import Header from "@/components/shared/header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Header />
        <main className="pt-[60px]">{children}</main>
      </body>
    </html>
  );
}

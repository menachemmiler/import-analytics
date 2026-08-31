import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "נתיב | מודיעין שוק וכדאיות ייבוא",
  description:
    "לוח בקרה לכדאיות ייבוא: עלות נחיתה, מתחרים בישראל, ספקים גלובליים ועמילי מכס.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}

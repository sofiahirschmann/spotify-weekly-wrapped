import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata = {
  title: "Weekly Wrapped",
  description: "Your week on Spotify, as a card you can post.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body>{children}</body>
    </html>
  );
}

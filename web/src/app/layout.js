import { Newsreader, Inter } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "ThreadNews — Verified Independent & Regional Intelligence",
  description:
    "Real-time news aggregator for Ethiopia, the Horn of Africa, and global broadsheets. Multi-source verified, ad-free, and velocity ranked.",
  keywords: [
    "Ethiopia news",
    "Addis Ababa",
    "Horn of Africa",
    "Tikvah Ethiopia",
    "Addis Standard",
    "Borkena",
    "Japan Times",
    "BBC Africa",
    "Breaking news",
  ],
  authors: [{ name: "ThreadNews Desk" }],
  openGraph: {
    title: "ThreadNews — Real-Time Verified Intelligence",
    description:
      "Cross-source verified news from Addis Ababa to Tokyo without sensationalism.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-[#111111] selection:bg-[#E8E6E1]">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kangning (Ken) Huang — NYU Shanghai",
    template: "%s — Kangning (Ken) Huang",
  },
  description:
    "Assistant Professor of Environmental Studies at NYU Shanghai. Research on urbanization, climate change, and environmental hazards.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Kangning (Ken) Huang",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

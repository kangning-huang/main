import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const GA_ID = "G-M6RRTZHMPZ";

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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

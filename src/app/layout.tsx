import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/language-context";
import "./globals.css";
import { personSchema, websiteSchema, OG_IMAGE_PATH } from "@/lib/seo";

const GA_ID = "G-M6RRTZHMPZ";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kangning-huang.github.io/main"),
  title: {
    default: "Kangning (Ken) Huang — Assistant Professor, NYU Shanghai",
    template: "%s | Kangning (Ken) Huang",
  },
  description:
    "Kangning (Ken) Huang is an Assistant Professor of Environmental Studies at NYU Shanghai researching urbanization, urban heat islands, climate adaptation, remote sensing, and urban scaling laws.",
  keywords: [
    "Kangning Huang", "Ken Huang", "黄康宁", "NYU Shanghai",
    "urban heat island", "urban expansion", "climate adaptation",
    "remote sensing", "urban scaling laws", "GIScience",
    "urbanization and climate change", "urban climate modeling",
    "Yale PhD", "environmental studies", "NCAR postdoc",
  ],
  authors: [{ name: "Kangning (Ken) Huang", url: "https://kangning-huang.github.io/main" }],
  creator: "Kangning (Ken) Huang",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Kangning (Ken) Huang",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Kangning (Ken) Huang — NYU Shanghai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdPerson = personSchema();
  const jsonLdSite = websiteSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdPerson) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSite) }}
        />
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
        <LanguageProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}

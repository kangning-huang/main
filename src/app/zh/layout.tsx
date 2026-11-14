/**
 * Nested layouts cannot change the root <html lang="en"> attribute in a
 * static export. A blocking inline script (here and in the root <head>)
 * sets document.documentElement.lang to zh-Hans for crawlers that execute
 * JavaScript. Page metadata also declares locale zh-Hans / zh_CN.
 */
export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="zh-Hans";`,
        }}
      />
      {children}
    </>
  );
}

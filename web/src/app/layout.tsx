import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Snabb Web",
  description: "The fast, reliable platform for getting things done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="strip-extension-hydration-attrs" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function () {
              function stripInjectedAttrs(root) {
                var nodes = root.querySelectorAll ? root.querySelectorAll('[bis_skin_checked]') : [];
                for (var i = 0; i < nodes.length; i += 1) {
                  nodes[i].removeAttribute('bis_skin_checked');
                }
                if (root.removeAttribute) {
                  root.removeAttribute('bis_skin_checked');
                }
              }

              stripInjectedAttrs(document);
              new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i += 1) {
                  if (mutations[i].type === 'attributes' && mutations[i].attributeName === 'bis_skin_checked') {
                    mutations[i].target.removeAttribute('bis_skin_checked');
                  }
                }
              }).observe(document.documentElement, {
                attributes: true,
                subtree: true,
                attributeFilter: ['bis_skin_checked']
              });
            })();
          `
        }} />
      </head>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

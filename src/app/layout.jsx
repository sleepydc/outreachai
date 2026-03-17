import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "OutreachAI \u2014 Affiliate Outreach Platform",
  description: "Find creators, send outreach, track deals \u2014 powered by Claude Cowork",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

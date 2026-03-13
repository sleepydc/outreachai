import "./globals.css";

export const metadata = {
  title: "OutreachAI",
  description: "Affiliate outreach platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

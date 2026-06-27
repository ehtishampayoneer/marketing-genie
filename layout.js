export const metadata = {
  title: "Marketing Genie",
  description: "Your AI growth operator."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

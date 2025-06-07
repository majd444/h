export const metadata = {
  title: 'Backend API Server',
  description: 'API Server for application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

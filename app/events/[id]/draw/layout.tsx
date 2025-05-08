export const metadata = {
  title: 'Live Draw'
};

// This configuration makes this layout independent of parent layouts
export default function DrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
} 
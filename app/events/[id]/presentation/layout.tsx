export const metadata = {
  title: 'Event Presentation'
};

// This configuration makes this layout independent of parent layouts
export default function PresentationLayout({
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
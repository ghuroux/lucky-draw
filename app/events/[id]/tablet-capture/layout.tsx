export const metadata = {
  title: 'Tablet Capture',
  description: 'Efficient event entry capture interface',
};

// Override the root layout to use this layout for tablet capture
export const dynamic = 'force-dynamic';

// This ensures this layout doesn't use the root layout
export const layout = 'default';

export default function TabletCaptureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Tablet Capture</title>
      </head>
      <body className="overflow-y-auto h-full dark:bg-gray-900">
        {children}
      </body>
    </html>
  );
} 
import ClientLayout from '@/components/ClientLayout';

export const metadata = {
  title: 'Digital Content & E-Book Lending Platform',
  description: 'Library management system for digital and physical content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}

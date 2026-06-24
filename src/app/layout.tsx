import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Chess - Play vs Stockfish",
  description: "A premium responsive Chess Game with Stockfish analysis, move history, and offline PWA support.",
  manifest: "/manifest.json",
  icons: {
    icon: "/pieces/white_king.svg",
    apple: "/pieces/white_king.svg"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import '../../content/theme.css'

export const metadata: Metadata = {
  title: { template: '%s | Onvu', default: 'Onvu' },
  description: 'Personal portfolio and digital garden.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        {/* Prevent flash of unstyled theme — runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t){var p=JSON.parse(t);document.documentElement.className=document.documentElement.className.replace(/\\btheme-\\S+/g,'').trim()+' theme-'+p.state.theme;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-fg">{children}</body>
    </html>
  )
}

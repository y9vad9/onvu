import NoteOgImage, { generateStaticParams as ogGenerateStaticParams } from './opengraph-image'

export const dynamic = 'force-static'
export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Article preview'

export const generateStaticParams = ogGenerateStaticParams
export default NoteOgImage

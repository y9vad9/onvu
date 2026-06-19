import { FooterBody } from '~/content/footer'

/**
 * Thin shell — the actual footer content lives in `content/footer.tsx`,
 * which is user-owned and survives `git pull upstream`.
 */
export function Footer() {
  return <FooterBody />
}

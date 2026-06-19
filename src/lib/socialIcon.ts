import type { ReactNode } from 'react'
import { createElement } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Default platform → lucide icon name mapping for the most common socials.
 * Users add a platform that isn't here by passing `icon: 'IconName'` on the
 * `SocialLink` entry in `site.config.ts`. Any PascalCase lucide-react icon
 * is valid (https://lucide.dev/icons).
 */
const DEFAULTS: Record<string, string> = {
  github: 'Github',
  gitlab: 'Gitlab',
  linkedin: 'Linkedin',
  twitter: 'Twitter',
  x: 'Twitter',
  instagram: 'Instagram',
  youtube: 'Youtube',
  twitch: 'Twitch',
  facebook: 'Facebook',
  email: 'Mail',
  mail: 'Mail',
  rss: 'Rss',
  telegram: 'Send',
  discord: 'MessageCircle',
  slack: 'Slack',
  mastodon: 'AtSign',
  bluesky: 'Cloud',
  threads: 'AtSign',
  website: 'Globe',
  link: 'Link',
}

export function resolveSocialIcon(
  platform: string,
  iconName: string | undefined,
  size = 20,
): ReactNode {
  const name = iconName ?? DEFAULTS[platform.toLowerCase()]
  if (name) {
    const Icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name]
    if (Icon) return createElement(Icon, { size })
  }
  // Last-resort fallback: first letter of the platform name.
  return createElement(
    'span',
    { className: 'text-base font-bold' },
    platform.charAt(0).toUpperCase(),
  )
}

import type { CommentsConfig } from '@config/site'
import { GiscusComments } from './GiscusComments'

/**
 * Dispatcher for the comments section. Picks the renderer based on
 * `config.comments.provider`. Returns `null` when no provider is configured
 * (or `provider: 'none'`) so the entire section disappears.
 *
 * To add a new provider:
 *   1. Extend the `CommentsConfig` union in `src/config/site.ts`.
 *   2. Ship a renderer alongside `GiscusComments.tsx`.
 *   3. Add a `case` branch below.
 */
export function CommentsSection({ config }: { config?: CommentsConfig }) {
  if (!config || config.provider === 'none') return null

  switch (config.provider) {
    case 'giscus':
      return (
        <GiscusComments
          config={{
            repo: config.repo,
            repoId: config.repoId,
            category: config.category,
            categoryId: config.categoryId,
          }}
        />
      )
  }
}

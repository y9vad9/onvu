/**
 * Renders a JSON-LD `<script>` block. Accepts either a single object or
 * an array — arrays are emitted as multiple scripts so they parse cleanly
 * in Google's Rich Results Test.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown> | null | undefined>
}) {
  const items = Array.isArray(data) ? data.filter(Boolean) : [data]
  return (
    <>
      {items.map((item, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}

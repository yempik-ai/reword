/**
 * Structured data for search engines. The content is editable text, so `<` is
 * escaped: a sentence that holds `</script>` must stay a sentence.
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

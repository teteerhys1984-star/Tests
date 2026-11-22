/**
 * Renders a prompt that may contain **bold** markers (used by the source for
 * the highlighted word in "Adjective or Noun?" questions). All other text is
 * rendered verbatim, so the visible words match the source exactly.
 */
export function PromptText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

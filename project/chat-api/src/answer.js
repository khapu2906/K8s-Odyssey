// This is a book about Kubernetes, not about building a real AI product —
// so instead of calling a real LLM provider (and requiring every reader to
// bring their own API key), this does the simplest thing that can look like
// "an AI answering from a document": naive keyword overlap against whatever
// text was pasted in, picked one sentence at a time.

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function scoreSentence(sentence, questionWords) {
  const sentenceWords = new Set(
    sentence.toLowerCase().match(/[a-z0-9]+/g) ?? []
  );
  let score = 0;
  for (const word of questionWords) {
    if (sentenceWords.has(word)) score += 1;
  }
  return score;
}

export function answer(message, documentText) {
  if (!documentText || !documentText.trim()) {
    return "I don't have a document to work from yet — paste some text in and ask me again.";
  }

  const questionWords = message.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const sentences = splitSentences(documentText);

  if (sentences.length === 0) {
    return "That document doesn't have anything I can read yet.";
  }

  let best = sentences[0];
  let bestScore = -1;
  for (const sentence of sentences) {
    const score = scoreSentence(sentence, questionWords);
    if (score > bestScore) {
      bestScore = score;
      best = sentence;
    }
  }

  return bestScore > 0
    ? best
    : "I couldn't find anything in the document about that.";
}

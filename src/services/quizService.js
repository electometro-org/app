// Compute unique question indices (for navigation through unique questions)
export function computeUniqueIndices(questions) {
  const seen = new Set();
  return questions.reduce((arr, q, i) => {
    if (!seen.has(q.question)) {
      seen.add(q.question);
      arr.push(i);
    }
    return arr;
  }, []);
}

// Find next unique question index after current
export function findNextUniqueIndex(uniqueIndices, currentIndex) {
  return uniqueIndices.find(i => i > currentIndex);
}

// Find previous unique question index before current
export function findPrevUniqueIndex(uniqueIndices, currentIndex) {
  for (let i = uniqueIndices.length - 1; i >= 0; i--) {
    if (uniqueIndices[i] < currentIndex) return uniqueIndices[i];
  }
  return undefined;
}

// Safe JSON fetch with error handling
export function fetchJsonSafe(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`Fetch failed for ${url}`);
    return r.json();
  });
}
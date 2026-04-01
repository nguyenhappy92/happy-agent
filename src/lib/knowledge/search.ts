import { articles, type Article } from "./articles";

export function searchKnowledgeBase(query: string): Article[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) return [];

  const scored = articles.map((article) => {
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (titleLower.includes(term)) score += 5;
      if (article.tags.some((tag) => tag.includes(term))) score += 3;

      const occurrences = (contentLower.match(new RegExp(term, "g")) ?? [])
        .length;
      score += occurrences;
    }
    return { article, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.article);
}

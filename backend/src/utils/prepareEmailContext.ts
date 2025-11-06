import { htmlToText } from "html-to-text";

export function prepareEmailContent(raw:string) {
  if (!raw) return "";
  const withoutImages = raw.replace(/<img[\s\S]*?>/gi, "");
  const withoutHref = withoutImages.replace(/<a\s+[^>]*>(.*?)<\/a>/gi, "$1");
  const text = htmlToText(withoutHref, { wordwrap: false });
  return text.trim().replace(/\s+/g, " ").slice(0, 300);
}

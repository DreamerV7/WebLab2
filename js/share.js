
const enc = encodeURIComponent;

export function shareLinks({ title, text, url }) {
  return {
    vk: `https://vk.com/share.php?url=${enc(url)}&title=${enc(title)}&description=${enc(text)}`,
    telegram: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    whatsapp: `https://wa.me/?text=${enc(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

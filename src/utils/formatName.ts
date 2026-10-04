export function formatName(value?: string | null) {
  if (!value) return ''

  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-NG')
    .replace(
      /(^|[\s'-])\p{L}/gu,
      (letter) => letter.toLocaleUpperCase('en-NG'),
    )
}

export function toSlug(input: string): string {
  const withAmpersand = input.replace(/&/g, ' va ')
  const withoutD = withAmpersand.replace(/đ/g, 'd').replace(/Đ/g, 'D')
  const stripped = withoutD.normalize('NFD').replace(/\p{M}+/gu, '')
  return stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

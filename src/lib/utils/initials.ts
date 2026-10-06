/** First letter of a name, uppercased. Names not starting with a letter give null. */
export function initialOf(name: string): string | null {
  const letter = name.trim().charAt(0).toUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : null
}

/** Sorted list of the letters a set of names actually starts with. */
export function initialsOf(names: string[]): string[] {
  const seen = new Set<string>()
  for (const name of names) {
    const letter = initialOf(name)
    if (letter) seen.add(letter)
  }
  return [...seen].sort()
}

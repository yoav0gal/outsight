function getDir(locale: string) {
  // @ts-ignore - getTextInfo may not be in dom/node types yet
  return new Intl.Locale(locale).getTextInfo().direction;
}
console.log(getDir("he"));

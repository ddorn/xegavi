
export const numberToEnglishOrdinal = (n: number) => {
  if (n % 100 === 11 || n % 100 === 12 || n % 100 === 13) {
    return `${n}th`;
  }
  if (n % 10 === 1) {
    return `${n}st`;
  }
  if (n % 10 === 2) {
    return `${n}nd`;
  }
  if (n % 10 === 3) {
    return `${n}rd`;
  }
  return `${n}th`;
};

export const showKeyboardHints = (): boolean => {
  // We only show keyboard hints if we're not on a touch device
  // Ideally, we would do it only if there's a keyboard attached,
  // but I don't think that's possible.
  // So we check if there a mouse/trackpad attached, in which case,
  // there's likely a keyboard, as opposed to a touch device.
  // Of course, this is not perfect, but it's better than nothing.
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(pointer: fine)').matches;
};

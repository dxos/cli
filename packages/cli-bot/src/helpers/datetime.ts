//
// Copyright 2021 DXOS.org
//

const units = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: 24 * 60 * 60 * 1000 * 365 / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
};

export const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const dateDiff = (d1: Date, d2: Date = new Date()) => {
  const elapsed = d1.valueOf() - d2.valueOf();
  if (isNaN(elapsed)) {
    return undefined;
  }

  let unit: keyof typeof units;
  for (unit in units) {
    if (Math.abs(elapsed) > units[unit] || unit === 'second') {
      return { value: Math.round(elapsed / units[unit]), unit };
    }
  }
};

export const getTimeDelta  = (d1: Date, d2: Date = new Date()) => {
  const diff = dateDiff(d1, d2);
  if (!diff) {
    return undefined;
  }

  const { value, unit } = diff;
  return `${-value} ${unit}` + (-value > 1 ? 's' : '');
};

// A blank form field arrives as "" which is not the same thing as "nothing".
// MySQL rejects "" for a DATE column and would store "" instead of NULL in
// text columns, so every optional field passes through here first.
function blankToNull(value) {
  return value === '' ? null : value;
}

// Copies only the listed fields that were actually sent (blanks become null),
// so a partial update never wipes fields the caller didn't mention.
function pick(body = {}, keys) {
  const picked = {};
  for (const key of keys) {
    if (body[key] !== undefined) picked[key] = blankToNull(body[key]);
  }
  return picked;
}

module.exports = { blankToNull, pick };

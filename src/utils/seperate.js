module.exports = function separate(str, to) {
  let res = str;
  let sw = 1;
  for (let i = 0; i < 100; i++) {
    if (sw === 1) res = res + ' ';
    else res = ' ' + res;
    if (res.length >= to) break;
    sw = sw * -1;
  }
  return res;
}

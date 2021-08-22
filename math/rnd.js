export default class Rnd {
  static int(minMax, max) {
    let min = 0;
    if (!max) {
      max = minMax;
    } else {
      min = minMax;
      max = max;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

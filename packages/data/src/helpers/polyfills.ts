if (typeof Array.prototype.entries !== 'function') {
  // eslint-disable-next-line no-extend-native
  Array.prototype.entries = function* entries() {
    for (let i = 0; i < this.length; i++) {
      yield [i, this[i]];
    }
  };
}

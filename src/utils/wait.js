module.exports = function wait(a) { return new Promise(r => { setTimeout(() => r(), a); }); };

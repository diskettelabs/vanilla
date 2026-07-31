let uninstallHandler = null;

module.exports = {
  setUninstallHandler(fn) {
    uninstallHandler = fn;
  },
  getUninstallHandler() {
    return uninstallHandler;
  },
};

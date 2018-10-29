var regex_utils = module.exports = {
    getFilenameFromPath: function(path) {
        return path.replace(/^.*[\\\/]/, '');
    }
}
/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

var regex_utils = module.exports = {
    getFilenameFromPath: function(path) {
        return path.replace(/^.*[\\\/]/, '');
    }
}
/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

var json = module.exports = {
    error: function(errorMessage) {
        return JSON.stringify({error: errorMessage});
    },
    
    success: function(successMessage) {
        return JSON.stringify({success: successMessage});
    },

    fuck: function(fuckkkk) {
        return JSON.stringify({fuck: "you fucked up"});
    }
}

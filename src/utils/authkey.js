/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

var userware = require("../middleware/userware");

var authkey = module.exports = {
    authKeyExists: async function(authkey) {
        try {
            if(await userware.authKeyExists(authkey) === false) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    }
}
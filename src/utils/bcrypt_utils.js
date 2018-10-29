const bcrypt = require('bcrypt');

var passwords = module.exports = {
    hash: async function(password) {
        try {
            var hash = await bcrypt.hash(password, 10);
            return hash;
        } catch(err) {
            console.log(err);
        }
        
    },

    checkPassword: async function(password, hashedPassword) {
        try {
            var match = await bcrypt.compare(password, hashedPassword);
            return match;
        } catch(err) {
            console.log(err);
        }
    }
}

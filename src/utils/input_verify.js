var inputVerify = module.exports = {
    createUserVerify: function(username, email, password) {
        var inputValidity = {};

        if(!username.trim() || username == "") {
            inputValidity.username = false;
        } else {
            inputValidity.username = true;
        }

        if(!email.trim() || email == "") {
            inputValidity.email = false;
        } else {
            inputValidity.email = true;
        }

        if(!password.trim() || password == "") {
            inputValidity.password = false;
        } else {
            inputValidity.password = true;
        }

        return inputValidity;
    }
}
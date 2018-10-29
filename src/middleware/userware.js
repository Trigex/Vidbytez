const mongoose = require('mongoose');
const userModel = require('../models/user');
const hat = require("hat");
const shortid = require("shortid");
const ffmpeg = require("../utils/ffmpeg_utils");

var userware = module.exports = {
    /*  
     *   Check if the given username exists
     *   if it does, return true, else, false
     */
    usernameExists: async function (username) {
        try {
            var user = await userModel.findOne({username: username});
            if(!user) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    },

    /*  
     *   Check if the given email exists
     *   if it does, return true, else, false
     */
    emailExists: async function(email) {
        try {
            var user = await userModel.findOne({email: email});
            if(!user) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    },

    /*  
    *   Create a user, return bool on success
    */
   createUser: async function(username, hashedPassword, email) {
        try {
            await userModel.create({username: username, password: hashedPassword, email: email, creation: Date.now(), auth: 0, userID: shortid.generate(), channelName: username, bio: "I'm a very boring person.", avatarPath: "none.png"});
            
            var newUser = await userModel.find({username: username});

            if(newUser === []) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    },

    getUser: async function(username) {
        try {
            var user = await userModel.findOne({username: username});

            if(!user) {
                // if the user doesn't exist, return null
                return null;
            } else {
                return user;
            }
        } catch(err) {
            console.log(err);
        }
    },

    getUserByObjectID: async function(objectID) {
        try {
            var user = await userModel.findOne({_id: objectID});

            if(!user) {
                return null;
            } else {
                return user;
            }
        } catch(err) {
            console.log(err);
        }
    },

    /*
    *   Gets the hashed password of a given user,
    *   returns the password if the user was found,
    *   otherwise, return null
    */
   getHashedPassword: async function(username) {
        try {
            var user = await userModel.findOne({username: username});

            if(!user) {
                // if the user doesn't exist, return null
                return null;
            } else {
                return user.password;
            }
        } catch(err) {
            console.log(err);
        }
    },

    /*
    *   Updates the authkey of user username, returns true if the authkey has been updated, false if not
    */
   insertAuthKey: async function(username, authKey) {
        try {
            var originalUser = await userModel.findOne({username: username});
            // Update the authkey for the user
            var user = await userModel.findOneAndUpdate({username: username}, {$set:{authKey: authKey}}, {new: true});
            if(user.authKey != originalUser.authKey) {
                return true;
            } else {
                return false;
            }
        } catch(err) {
            console.log(err);
        }
    },

    destroyAuthKey: async function(username) {
        try {
            var user = await userModel.findOneAndUpdate({username: username}, {$set:{authKey: null}}, {new: true});
        } catch(err) {
            console.log(err);
        }
    },

    getAuthKey: async function(username) {
        try {
            var user = await userModel.findOne({username: username});

            if(!user) {
                // if the user doesn't exist, return null
                return null;
            } else {
                return user.authKey;
            }
        } catch(err) {
            console.log(err)
        }
    },

    authKeyExists: async function(authKey) {
        try {
            var user = await userModel.findOne({authKey: authKey});
            if(user === null) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    },

    getUserByAuthKey: async function(authKey) {
        try {
            var user = await userModel.findOne({authKey: authKey});
            if(user === null) {
                return null;
            } else {
                return user;
            }
        } catch(err) {
            console.log(err);
        }
    }
}
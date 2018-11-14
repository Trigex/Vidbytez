var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username: {type: String, max: 25}, // the users username
    email: {type: String, max: 254}, // the users email
    gender: {type: String, max: 6}, // the users gender
    password: String, // the hashed user password
    subscribing: [{type: mongoose.Schema.ObjectId, ref: 'User'}], // users this user follows
    subscribers: [{type: mongoose.Schema.ObjectId, ref: 'User'}], // users following this user
    creation: String, // creation timestamp of user
    avatarPath: String, // avatar location
    auth: Number, // User auth, NOT authkey, 0 = regular user, 1 = mod, 2 = admin,
    authKey: String, // The API authkey generated on login
    userID: String, // 8 char user id
    channelComments: [{type: mongoose.Schema.ObjectId, ref: 'Comment'}], // comments posted to the channel page
    friends: [{type: mongoose.Schema.ObjectId, ref: 'User'}], // friends of the user
    bio: String, // the user's bio
    intrests: String, // user intrests
    links: [String], // links
    ratedVideos: [String] // list of video's (videoID) the user has rated
});

module.exports = mongoose.model("User", userSchema);
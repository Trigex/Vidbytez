const mongoose = require('mongoose');
const commentModel = require('../models/comment');
const shortid = require("shortid");
const videoware = require("./videoware");
const userware = require("./userware");

var commentware = module.exports = {
    getCommentsByVideoID: async function(videoID) {
        try {
            var video = await videoware.getVideoByID(videoID);
            if(video!=null) {
                var comments = [];
                // convert object IDs into raw comment object
                for(var comment of video.comments) {
                    // get comment
                    var comment = await commentModel.findById(comment._id);
                    // convert author id of comment into raw user object
                    comment.author = await userware.getUserByObjectID(comment.author);
                    // delete sensitive data or otherwise uneeded data from author
                    comment.author.email = undefined;
                    comment.author.authKey = undefined;
                    comment.author.password = undefined;
                    comment.author._id = undefined;
                    comment.author.creation = undefined;
                    comments.push(comment);
                }
                return comments;
            } else {
                return null;
            }
        } catch(err) {
            console.log(err);
        }
    },

    createComment: async function(videoID, author, content) {
        try {
            var comment = await commentModel.create({author: author, content: content, timestamp: new Date(Date.now()).toLocaleString()});
            var response = await videoware.addCommentToVideo(videoID, comment);
            return response;
        } catch(err) {
            console.log(err);
        }
    }
}
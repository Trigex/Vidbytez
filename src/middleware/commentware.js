const mongoose = require('mongoose');
const commentModel = require('../models/comment');
const shortid = require("shortid");
const videoware = require("./videoware");

var commentware = module.exports = {
    getCommentsByVideoID: async function(videoID) {
        var video = await videoware.getVideoByID(videoID);
        if(video!=null) {
            return video.comments;
        } else {
            return null;
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
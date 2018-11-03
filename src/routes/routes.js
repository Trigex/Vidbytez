const config = require('../../config.json');
const videoware = require("../middleware/videoware");
const userware = require("../middleware/userware");
const commentware = require("../middleware/commentware");

module.exports = function(app) {
    app.get("/", function(req, res){
        res.redirect("/home");
    });

    app.get("/home", async function(req, res){
        // get all videos!
        var videos = await videoware.getAllVideos();
        res.render("home", {config: config, session: req.session, videos: videos});
    });

    app.get("/login", function(req, res){
        res.render("login", {config: config, session: req.session});
    });

    app.get("/register", function(req, res){
        res.render("register", {config: config, session: req.session});
    });

    app.get("/video/:id", async function(req, res){
        // get video
        var videoID = req.params.id;
        var video = await videoware.getVideoByID(videoID);
        if(video !== null) {
            // get author
            var author = await userware.getUserByObjectID(video.author);
            var comments = await commentware.getCommentsByVideoID(videoID);
            console.log(comments);
            res.render("video", {config: config, session: req.session, video: video, author: author, comments: comments});
        } else {
            // 404
            res.redirect("/404");
        }
    });

    app.get("/404", function(req, res){
        res.render("404", {config: config, session: req.session})
    });

    app.get("/upload", function(req, res){
        if(typeof req.session.username === "undefined") {
            res.redirect("/login");
            return;
        } else {
            res.render("upload", {config: config, session: req.session});
        }
    })
}
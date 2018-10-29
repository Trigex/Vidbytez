const config = require('../../config.json');
const videoware = require("../middleware/videoware");
const userware = require("../middleware/userware");

module.exports = function(app) {
    app.get("/", function(req, res){
        res.redirect("/home");
    });

    app.get("/home", function(req, res){
        res.render("home", {config: config, session: req.session});
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
            res.render("video", {config: config, session: req.session, video: video, author: author});
        } else {
            // 404
            res.render("404", {config: config, session: session});
        }
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
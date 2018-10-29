/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

// probably ghetto and insecure way of storing the api key, but fuck yeah cookies!!!!!
function createCookie(key, value, date) {
    var expiration = new Date(date).toUTCString();
    var cookie = escape(key) + "=" + escape(value) + ";expires=" + expiration + ";";
    document.cookie = cookie;
    console.log(cookie);
    console.log("Creating new cookie with key: " + key + " value: " + value + " expiration: " + expiration);
}

function readCookie(name) {
    var key = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(key) === 0) {
            return cookie.substring(key.length, cookie.length);
        }
    }
    return null;
}

function deleteCookie(name) {
    createCookie(name, "", -1);
}

// self explanitory fucknut
function convertFormDataToJson(form) {
    return _.object($(form).serializeArray().map(function (v) {
        return [v.name, v.value];
    }));
}

// quick notification creator
function createNotification(content, type) {
    new Noty({
        text: content,
        type: "alert",
        theme: "nest",
        type: type
    }).show();
}

/* FORM EVENTS MOTHERFUCKER!!!! */

// user login (/login)
$("#user_login").submit((event) => {
    event.preventDefault();

    var formJson = convertFormDataToJson("#user_login");
    userLogin(formJson);
});

$("#user_register").submit((event) => {
    event.preventDefault();

    var formJson = convertFormDataToJson("#user_register");
    userRegister(formJson);
});

$("#logout").click(() => {
    $.ajax({
        url: "/api/user/logout",
        type: "POST",
        data: {
            destroy_session: true
        },
        success: (serverResponse) => {
            var response = JSON.parse(serverResponse);
            if(response.error) {
                createNotification(response.error, "error");
            } else {
                deleteCookie("authKey");
                createNotification(response.success, "success");

                setTimeout(() => {
                    window.location = "/home"
                }, 1000)
            }
        }
    });
});



/* AJAX!!! */
function userRegister(registerFormJson) {
    $.ajax({
        url: "/api/user/create",
        type: "POST",
        data: {
            username: registerFormJson.username,
            password: registerFormJson.password,
            email: registerFormJson.email
        },
        success: (serverResponse) => {
            var response = JSON.parse(serverResponse);
            if(response.error) {
                createNotification(response.error, "error");
            } else {
                createNotification(response.success, "success");

                setTimeout(() => {
                    window.location = "/login"
                }, 2000)
            }
        }
    });
}

function userLogin(loginFormJson) {
    $.ajax({
        url: "/api/user/login",
        type: "POST",
        data: {
            username: loginFormJson.username,
            password: loginFormJson.password,
            create_session: true
        },
        success: (serverResponse) => {
            var response = JSON.parse(serverResponse);
            if(response.error) {
                createNotification(response.error, "error");
            } else {
                // store authkey as a cookie
                createCookie("authKey", response.authKey, Date.UTC(2020, 1, 1));
                createNotification(response.success, "success");

                setTimeout(() => {
                    window.location = "/home"
                }, 1000)
            }
        }
    });
}

/* STOLEN VIDLII JS ALERT ALERT LOL */

// on new upload from (/upload)
function new_upload() {
    // selects the video file
    var video = $("#selectedFile")[0].files[0];
    // get file type?
    var extension = video.name.lastIndexOf(".");
    var page_title = $("title").html();
    var video_title = video.name;
    var video_thumb = 0;
    if (extension != -1)
        video_title = video_title.substring(0, extension);
    if (video_title.length < 4)
        video_title = "Untitled";
    // set page values
    $("#video_title").val(video_title);
    $("#video_title_header").html(video_title);
    $("#custom_thumb_button").on("click mousedown", function() {
        if (!$(this).hasClass("loading")) {
            $("#custom_thumb_file").click();
            return !1
        }
    });
    $("#selectedFile").prop("disabled", !0);
    $("#uploader").animate({
        opacity: 0
    }, 500, function() {
        $("#old_upload_box").hide();
        $("#upload_select_box").show();
        $("#video_uploader").css("opacity", 0).animate({
            opacity: 1
        }, 500)
    });
    video_upload_check(video);
}

function video_upload_check(video) {
    $.ajax({
        url: "/api/video/upload",
        type: "POST",
        data: {
            action: "check",
            filename: video.name,
            filesize: video.size,
            filetype: video.type,
            authKey: readCookie("authKey")
        },
        success: function(serverResponse) {
            var response = JSON.parse(serverResponse);
            if(response.error) {
                createNotification(response.error, "error");
            } else {
                createNotification(response.success, "success");
                var videoID = response.videoID;
                // create hidden videoID element on page, used for updating metadata
                $("#video_progress").append("<p hidden id='videoid'>" + videoID + "</p>");
                // go on, upload it motherfucker!
                upload_video(video, videoID);
            }
        },
        error: function() {
            u("An error has occurred. Upload aborted!", !0)
        }
    });
}

function upload_video(video, videoID) {
    console.log("upload started");
    // video upload ajax (harder to do through jQuery lol kill me)
    var formData = new FormData();
    formData.append("video_file", video);
    formData.append("action", "upload");
    formData.append("authKey", readCookie("authKey"));
    formData.append("videoID", videoID);
    var ajax = new XMLHttpRequest();
    ajax.upload.addEventListener("progress", videoProgressHandle, false);
    ajax.addEventListener("load", videoCompleteHandle, false);
    ajax.addEventListener("error", videoErrorHandle, false);
    ajax.addEventListener("abort", videoAbortHandle, false);
    ajax.open("POST", "/api/video/upload");
    ajax.send(formData);
}

function videoProgressHandle(event) {
    var percent = (event.loaded / event.total) * 100;
    $("#video_progress").val(Math.round(percent));
    $("#video_progress_text").text(Math.round(percent) + "%");
}

function videoCompleteHandle(event) {
        createNotification("The video was uploaded!!! Congrats!!!", "success");
}

function videoErrorHandle(event) {
    createNotification("The upload failed!", "error");
}

function videoAbortHandle(event) {
    createNotification("The upload was aborted!", "error");
}

function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null
}

function save_video_changes() {
    var description = $("#video_description").val();
    var tags = $("#video_tags").val();
    var title = $("#video_title").val();
    var videoID = $("#videoid").text();
    $.ajax({
        url: "/api/video/update",
        type: "POST",
        data: {
            title: title,
            description: description,
            tags: tags,
            videoID: videoID,
            authKey: readCookie("authKey")
        },
        success: function(serverResponse) {
            var response = JSON.parse(serverResponse);
            if(response.success) {
                createNotification("The video information was updated!", "success");
            }
        }
    })
}
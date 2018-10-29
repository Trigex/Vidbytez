var session = module.exports = {
    createSession: function(session, username, authKey) {
        session.username = username;
        session.authKey = authKey;
    },

    destroySession: function(session) {
        session.destroy();
    },

    setSessionAuthKey: function(session, authKey) {
        session.authKey = authKey;
    },

    getSessionAuthKey: function(session) {
        return session.authKey;
    }
}
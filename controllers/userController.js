const User = require("../models/User")
const Post = require("../models/Post")

exports.mustBeLoggedIn = function(req, res, next) {
    if(req.session.user) {
        next()
    } else {
        req.flash("errors", "you need be logged in to created a record!")
        req.session.save(function() {
            res.redirect("/")
        })
    }
}

exports.home = function(req, res) {
    if(req.session.user) {
        res.render("home-dashboard", {errors: req.flash("errors")})
    } else {
        res.render("home-guest", {mistakes: req.flash("errors"), regErrors: req.flash("regErrors")})
    }
    
}

exports.login = function(req, res) {
    // create user object
    let user = new User(req.body)
    user.login().then(function() {
        req.session.user = {
            avatar: user.avatar,
            usersymbol: user.data.username,
            _id: user.data._id
        }
        req.session.save(function() {
            res.redirect("/")
        })    
    }).catch(function(errors) {
        req.flash("errors", errors)
        req.session.save(function() {
            res.redirect("/")
        })
    })
}

exports.register = function(req, res){
    // create user object
    let user = new User(req.body)

    // call register method from newly created user object to check if it availabe of registration
    user.register().then(() => {
        req.session.user = {
            usersymbol: user.data.username, 
            avatar: user.avatar,
            _id: user.data._id
        }
        req.session.save(function() {
            res.redirect("/")
        })
    }).catch((reqErrors) => {
        reqErrors.forEach(function(error) {
            req.flash("regErrors", error)
        })
        req.session.save(function() {
            res.redirect("/")
        })
    })

}

// logout function
exports.logout = function (req, res) {
    // delete session of this browser
    req.session.destroy(function() {
        res.redirect("/")
    })      
}

exports.ifUserExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(foundUser) {
        req.userDoc = foundUser
        console.log(req.userDoc._id)
        next()
        
    }).catch(function() {
        res.send("user doesn't exists!")
    })    
}

exports.getUserPosts = function(req, res) {
    // get posts by author id
    Post.getPostsByAuthorId(req.userDoc._id).then(function(posts) {
        console.log(req.userDoc)
        res.render("user-posts", 
            {foundUsername: req.userDoc.username, 
             foundUserAvatar: req.userDoc.avatar,
             posts: posts,
            success: req.flash("success")})
    }).catch(function() {
        res.send("sorry, try again later!!.")
    })
}
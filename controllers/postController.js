const Post = require("../models/Post")
const { register } = require("./userController")
const { search } = require("../app")

exports.viewTemplateCreate = function(req, res) {
        res.render("post-template", {errors: req.flash("errors")})
    }

// exports.saveVeg = function(req, res) {
//     let vegeRecord = new Post(req.body, req.session.user._id)
//     let result = vegeRecord.saveVegObj()
//     if(!vegeRecord.errors.length) {
//         req.vegeObj = result
//         res.send(req.vegeObj)
//     } else {
//         req.vegeObj = {}
//         res.send(vegeRecord.errors)
//     }
// }
exports.create = function(req, res) {
    let post = new Post(req.body, req.visitorId, null, req.params.category)
    post.create().then((id) => {
        //res.redirect(`/${req.params.category}/${id}`)
        req.flash("success", "You've successfully created a record")
        req.session.save(() => {
            res.redirect(`/${req.params.category}/${id}`)
        })
    }).catch((errors) => {
        //res.send("abc")
        req.flash("errors", errors)
        req.session.save(() => {
            res.redirect("/create")
        })
    })
}

exports.viewSingleRecord = async function(req, res) {
    try {
        let post = await Post.findSingleByCategoryAndId(req.params.category, req.params.id, req.visitorId)
        console.log(post)
        res.render("single-post-view", {post: post, success: req.flash("success")})
    } catch {
        res.render("404")
    }  
}

exports.getEditScreen = function(req, res) {
    Post.findSingleByCategoryAndId(req.params.category, req.params.id, req.visitorId).then((post) => {
        res.render("record-edit", {post: post, success: req.flash("success"), errors: req.flash("errors")})
        console.log(post)
    }).catch(() => {
        res.send("sorry, no such post")
    })
}

exports.edit = function(req, res) {
    let newRecord = new Post(req.body, req.visitorId, req.params.id, req.params.category)
    newRecord.update().then((status) => {
        if(status == "success") {
            req.flash("success", "you successfully updated this record.")
            req.session.save(() => {
                res.redirect(`/${req.params.category}/${req.params.id}/edit`)
            })
        } else {
            newRecord.errors.forEach(function(error) {
                req.flash("errors", error)
            })
            req.session.save(function() {
                res.redirect(`/${req.params.category}/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        req.flash("errors","you can't complete this task.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}

exports.delete = function(req, res) {
    Post.delete(req.params.category, req.params.id, req.visitorId).then(() => {
        req.flash("success", "you are successfully deleted this record")
        req.session.save(() => {
            res.redirect(`/profile/${req.session.user.usersymbol}`)
        })
    }).catch((errors) => {
        // doesn't exist requested post(category and id)
        // if requested post exist, but visitor is not the owner of requested post
        req.flash("errors", errors)
        req.session.save(() => {
            res.redirect("/")
        })
    })
}

exports.search = function(req, res) {
    Post.search(req.body.searchTerm, req.visitorId).then((posts) => {
        res.json(posts)
    }).catch(() => {
        res.json([])
    })
}
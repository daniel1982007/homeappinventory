const { MongoClient, ObjectId } = require("mongodb")
const User = require("./User")

const postsCollection = require("../db").db().collection("posts")
const ObjectID = require("mongodb").ObjectID

let Post = function(data, userId, requestedPostId, category) {
    // parameter is real object, but left side of equal sign is just a name, just a pointer
    // you could say, a name = object, a name points to an object
    this.data = data
    this.errors = []
    this.userId = userId
    this.requestedPostId = requestedPostId
    this.category = category
}

Post.prototype.cleanUp = function() {
    if(typeof(this.category) != "string") {this.category = ""}
    if(typeof(this.data.name) != "string") {this.data.name = ""}
    if(typeof(this.data.quantity) != "string") {this.data.quantity = ""}

    this.data = {
        category: this.category.trim(),
        name: this.data.name.trim(),
        quantity: this.data.quantity.trim(),
        createDate: new Date(),
        author: new ObjectID(this.userId)
    }
}

// reduce duplication
// Post.prototype.dataForm = function() {
//     if(this.category == "vegetable") {
//         this.data = {
//             category: this.category,
//             name: this.data.name,
//             quantity: this.data.quantity,
//             createDate: new Date(),
//             author: new ObjectID(this.userId)
//         }
//     }

Post.prototype.validate = function() {
    // check validation of category
    if(this.category != "vegetable" && this.category != "meat" && this.category != "fruit" && this.category != "other") {
        this.errors.push("not a valid category")
    }

    // check validation of fields
    if(this.data.name == "") {this.errors.push("请输入名称")}
    if(this.data.quantity == "") {this.errors.push("请输入数量")}
}

Post.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        
        // check if any error
        if(!this.errors.length) {
            let info = await postsCollection.insertOne(this.data)
            resolve(info.ops[0]._id)
        } else {
            reject(this.errors)
        }
    })
}

// Post.prototype.validateVeg = function() {
//     // get rid of unnecessary properties and any other bogus properties.
//     this.data = {
//         vegetable: this.data.vegetable.trim(),
//         vegequantity: this.data.vegequantity.trim(),
//         createDate: new Date(),
//         author: ObjectID(this.userId)
//     }

//     if(this.data.vegetable == "") {this.errors.push("请输入蔬菜名")}
//     if(this.data.vegequantity == "") {this.errors.push("请输入公斤数")}
// }

// Post.prototype.saveVegObj = function() {
//     this.cleanUp()
//     this.validateVeg()
//     if(!this.errors.length) {
//         return this.data
//     } else {
//         return this.errors
//     }   
// }

Post.reusablePostQuery = function(uniqueQueryOperation, visitorId) {
    return new Promise(async function(resolve, reject) {    
        let aggOperations = uniqueQueryOperation.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                category: 1,
                name: 1,
                quantity: 1,
                createDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])
        
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.authorId = undefined

            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })

        // let post = await postsCollection.findOne({_id: new ObjectID(id)})
        resolve(posts)
    })
}

Post.findPostsByCategory = function(category) {
    return new Promise(async (resolve, reject) => {
        // check validation of category
        if(typeof(category) != "string") {
            reject()
            return
        }
        // find posts according to category
        let posts = await Post.reusablePostQuery([
            {$match: {category: category}},
            {$sort: {createDate: -1}}
        ])
        
        if(posts.length) {
            resolve(posts)
        } else {
            reject()
        }
    })
}

Post.findSingleByCategoryAndId = function(category, id, visitorId) {
    return new Promise(async function(resolve, reject) {
        // check validation of category and id
        if(typeof(category) != "string" || typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }
        // find posts by category
        //let postsCategory = await Post.findPostsByCategory(this.category)
        let posts = await Post.reusablePostQuery([
            {$match: {category: category, _id: new ObjectID(id)}},
        ], visitorId)

        // let post = await postsCollection.findOne({_id: new ObjectID(id)})
        if(posts) {
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.getPostsByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: new ObjectID(authorId)}},
        {$sort: {createDate: -1}}
    ])
}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleByCategoryAndId(this.category, this.requestedPostId, this.userId)
            if(post.isVisitorOwner) {
                let status = await this.actuallyUpdate()
                resolve(status)
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validateVeg()
        
        if(!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: ObjectID(this.requestedPostId)}, {$set: {vegetable: this.data.vegetable, vegequantity: this.data.vegequantity}})
            resolve("success")
        } else {
            resolve("failure")
        }       
    })
}

Post.delete = function(category, id, visitorId) {
    return new Promise(async (resolve, reject) => {
        // check if exist of requested post
        try {
            let post = await Post.findSingleByCategoryAndId(category, id, visitorId)
            // if post exist and visitor is the owner of post, then resolve
            if(post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectID(id)})
                resolve()
            } else {
                // if visitor is not owner of the post
                reject("you are not allowed for this operation")
            }    
        } catch {
            // not valid category and id or record doesn't exist
            reject("not valid")
        }    
    })
}

Post.search = function(inputValue, visitorId) {
    return new Promise(async (resolve, reject) => {
        if(typeof(inputValue) != "string") {
            reject()
        } else {
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: inputValue}}},
                {$sort: {score: {$meta: "textScore"}}}
            ], visitorId)
            resolve(posts)
        }
    })
}


module.exports = Post
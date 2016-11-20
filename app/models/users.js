'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var businessSchema = new Schema({
    name: String,
    url: String,
    snippet_text: String,
    image_url: String
});

var userSchema = new Schema({
    github: {
        id: String,
        displayName: String,
        username: String,
        publicRepos: Number
    },
    followed_businesses: [String],/* business_name */
    last_search_result: [businessSchema]
});

module.exports = mongoose.model('User', userSchema);

'use strict';

var Users = require('../models/users.js');
var mongoose = require('mongoose');

module.exports = function MainController() {

    /* yelp init */
    var yelp = require("node-yelp");
    var config = require('../config/yelp.js');

    var client = yelp.createClient({
        oauth: {
            "consumer_key": config.yelp_auth.consumer_key,
            "consumer_secret": config.yelp_auth.consumer_secret,
            "token": config.yelp_auth.token,
            "token_secret": config.yelp_auth.token_secret
        },
        httpClient: {
            maxSockets: 25
        }
    });

    /* middleware authentication methods */
    function check_authentication( req, res, next ) {
        if(req.isAuthenticated()) {
            return next();
        }
        else {
            console.log('User is not authenticated');
            res.redirect('/');
        }
    }

    /* db access methods */
    function find_user( user_id, callback ) {
        Users
            .findById( user_id )
            .exec( function(err, user) {
                if(err)
                    return callback(err);

                if(!user)
                    return callback( new Error('User { \'_id\': ' + user_id + ' } not found') );

                callback(null, { 'user': user });
            });
    }

    function save_search_result( relations, businesses, callback ) {
        relations.user.last_search_result = businesses.map(function(e) {
            return {
                'name': e.name,
                'url': e.url,
                'snippet_text': e.snippet_text,
                'image_url': e.image_url,
            };
        });

        relations.user.save( function(err, save_res) {
            if(err)
                return callback(err);

            callback(null, { 'user': save_res });
        });
    }

    function save_followed_business( relations, business_name, callback ) {
        relations.user.followed_businesses.push( business_name );
        relations.user.save( function(err, save_res) {
            if(err)
                return callback(err);

            callback(null, { 'user': save_res });
        });
    }

    function delete_followed_business( relations, business_name, callback ) {
        var t = relations.user.followed_businesses;
        t.splice( t.indexOf(business_name), 1 );

        relations.user.save( function(err, save_res) {
            if(err)
                return callback(err);

            callback(null, { 'user': save_res });
        });
    }

    /* utility methods */
    function apply_followed_status(user, business_info) {
        business_info['followed_status'] = ( user.followed_businesses.indexOf(business_info.name) !== -1 );
    }

    function prepare_search_result(businesses, user) {
        var result = [];
        businesses.forEach( function(business) {
            var business_info = {
                'name': business.name,
                'url': business.url,
                'snippet_text': business.snippet_text,
                'image_url': business.image_url,
            };

            if(user)
                apply_followed_status( user, business_info );

            result.push( business_info );
        });
        return result;
    }

    /* controller action methods */
    this.home = function(req, res) {
        /*client.search({
            terms: 'bar',
            location: 'Moscow'
        }).then(function (data) {
            var prepared_sr = prepare_search_result( data.businesses );
            res.render('main/home',
                       { 'title': 'Nightlife Home Page',
                         'auth_status': false,
                         'last_search_result': prepared_sr });
        }).catch(function (err) {
            console.log(err);
        });*/

        if( req.isAuthenticated() ) {
            find_user( req.user._id, function(err, fu_res) {
                if(err) throw err;

                var prepared_sr = prepare_search_result( fu_res.user.last_search_result, fu_res.user );

                res.render('main/home',
                           { 'title': 'Nightlife Home Page',
                             'auth_status': true,
                             'last_search_result': prepared_sr });
            });
        } else {
            res.render('main/home',
                       { 'title': 'Nightlife Home Page',
                         'auth_status': false });
        }
    };

    this.search = function(req, res) {
        client.search({
            terms: 'bar',
            location: req.body.location
        }).then(function (data) {
            if( req.isAuthenticated() ) {
                find_user( req.user._id, function(err, fu_res) {
                    save_search_result( fu_res, data.businesses, function(err, ssr_res) {
                        if(err) throw err;

                        console.log('SearchResult <' + ssr_res.user.last_search_result + '> saved for User <' + ssr_res.user.github + '>');
                    });

                    var prepared_sr= prepare_search_result( data.businesses, fu_res.user );
                    res.json({ 'auth_status': true, 'search_result': prepared_sr });//CHECK
                });
            } else {
                var prepared_sr = prepare_search_result( data.businesses );
                res.json({ 'auth_status': false, 'search_result': prepared_sr });
            }
        }).catch(function (err) {
            console.log(err);
        });
    };

    this.follow = [
        check_authentication,
        function(req, res) {
            find_user( req.user._id, function(err, fu_res) {
                if(err) throw err;

                save_followed_business( fu_res, req.body.business_name, function(err, sfb_res) {
                    if(err) throw err;

                    console.log('Business <' + req.body.business_name + '> followed by User <' + sfb_res.user.github + '>');

                    var prepared_sr= prepare_search_result( sfb_res.user.last_search_result, sfb_res.user );
                    res.json({ 'auth_status': true, 'search_result': prepared_sr });//CHECK
                });
            });
        }
    ];

    this.unfollow = [
        check_authentication,
        function(req, res) {
            find_user( req.user._id, function(err, fu_res) {
                if(err) throw err;

                delete_followed_business( fu_res, req.body.business_name, function(err, dfb_res) {
                    if(err) throw err;

                    console.log('Business <' + req.body.business_name + '> unfollowed by User <' + dfb_res.user.github + '>');

                    var prepared_sr= prepare_search_result( dfb_res.user.last_search_result, dfb_res.user );
                    res.json({ 'auth_status': true, 'search_result': prepared_sr });//CHECK
                });
            });
        }
    ];

}

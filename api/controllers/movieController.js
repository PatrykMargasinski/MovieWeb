'use strict';
const jwt = require('jsonwebtoken');

/*---------------MOVIE----------------------*/
var mongoose = require('mongoose'),
    Movie = mongoose.model('Movies'),
    Comment = mongoose.model('Comments'),
    User = mongoose.model('Users');

exports.list_movies = function (req, res) {
    Movie.find({}, function (err, movie) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.json(movie);
        }
    });
};

exports.create_new_movie = function (req, res) {
    var new_movie = new Movie(req.body);

    new_movie.save(function (err, movie) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.json(movie);
        }
    });
};

exports.get_movie = function (req, res) {
    Movie.findById({ _id: mongoose.Types.ObjectId(req.params.movieId) }, function (err, movie) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.json(movie);
        }
    });
};

exports.update_movie = function (req, res) {
    // authorization: check if Critic or Admin if not: res.status(403); "an access token is valid, but requires more privileges"
    Movie.findOneAndUpdate({ _id: req.params.movieId }, req.body, { new: true }, function (err, movie) {
        if (err) {
            if (err.name == 'ValidationError') {
                res.status(422).send(err);
            }
            else {
                res.status(500).send(err);
            }
        }
        else {
            res.json(movie);
        }
    });
};


exports.delete_movie = function (req, res) {
    //Check if the user is an administrator and if not: res.status(403); "an access token is valid, but requires more privileges"
    Movie.deleteOne({ _id: req.params.movieId }, function (err, movie) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.json({ message: 'Movie successfully deleted' });
        }
    });
};

exports.search_movies = function (req, res) {
    var query = {};

    if (req.query.title) {
        query.title = req.query.title;
    }

    if (req.query.q) {
        query.$text = {$search: req.query.q};
    }

    Movie.find(query)
        .exec(function (err, movie) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.json(movie);
            }
        });
};

exports.add_comment = function (req, res) {
    console.log(req.headers);
    if (req.headers && req.headers.authorization) {
        var authorization = req.headers.authorization.split(' ')[1],
            decoded;
        try {
            decoded = jwt.verify(authorization, 'supersecret');
        } catch (e) {
            return res.status(401).send('unauthorized');
        }
        var userId = decoded.id;
        User.findById(mongoose.Types.ObjectId(userId), function(err, user) {
            if (err){
                res.status(500).send(err);
            }
            else{
                var new_comment = new Comment(req.body);
                new_comment.author = user._id;
                var movieId = req.params.movieId;

                Movie.findOne({_id: mongoose.Types.ObjectId(movieId)}, function (err, movie) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        if(user.role == 'USER') {
                            var comments = movie.userComments;
                            comments.push(new_comment);
                            Movie.findOneAndUpdate({_id: mongoose.Types.ObjectId(movieId)}, {userComments: comments}, {new: true}, function (err, movie) {
                                if (err) {
                                    res.status(500).send(err);
                                } else {
                                    res.json(movie);
                                }
                            });
                        } else {
                            var comments = movie.criticsComments;
                            comments.push(new_comment);
                            Movie.findOneAndUpdate({_id: mongoose.Types.ObjectId(movieId)}, {criticsComments: comments}, {new: true}, function (err, movie) {
                                if (err) {
                                    res.status(500).send(err);
                                } else {
                                    res.json(movie);
                                }
                            });
                        }

                    }
                });
            }
        });

    } else {
        return res.send(500);
    }
};

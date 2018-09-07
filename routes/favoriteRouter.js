const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');
const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.all(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    next();
})
.get((req,res,next) => {
    Favorites.findOne({'user': req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post((req, res, next) => {
    Favorites.findOne({'user': req.user._id})
    .then((favorite) => {
        if (favorite) {
            favorite.dishes = req.body.filter(el => !favorite.dishes.includes(el));
            favorite.save()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(favorite);
            }, (err) => next(err)) 
        }
        else {
            Favorites.create(new Favorites({'user': req.user._id, 'dishes': req.body}))
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete((req, res, next) => {
    Favorites.deleteOne({'user': req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.all(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    next();
})
.get(cors.cors, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/'+ req.params.dishId);
})
.post((req, res, next) => {
    Favorites.findOne({'user': req.user._id})
    .then((favorite) => {
        if (favorite) {
            if (!favorite.dishes.some(el => el.equals(req.params.dishId))) {
                favorite.dishes.push(req.params.dishId);
                favorite.save()
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type','application/json');
                    res.json(favorite);
                }, (err) => next(err)) 
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(favorite);   
            }
        }
        else {
            Favorites.create(new Favorites({'user': req.user._id, 'dishes': [req.params.dishId]}))
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})
.delete((req, res, next) => {
    Favorites.findOne({'user': req.user._id})
    .then((favorite) => {
        if (favorite && favorite.dishes.some(el => el.equals(req.params.dishId))) {
            Favorites.updateOne({'user': req.user._id},
            {$set: {'dishes': favorite.dishes.filter(el => !el.equals(req.params.dishId))}})
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(favorite);
            }, (err) => next(err)) 
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found in favorites');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;
const express = require('express');
const router = express.Router();
const path = require('path');
const appDir = path.dirname(require.main.filename);
const book = require(appDir+'/controller/book')

router.post('/v1/book/saveWishlist', function(req, res, next) {
    book.saveWishlist(req,res,next)
});

router.get('/v1/book/wishlist', function(req, res, next) {
    book.getWishlist(req,res,next)
});

router.get('/v1/book/apiBook', function(req, res, next) {
    book.getApiBook(req,res,next)
});

router.post('/v1/book/delWishlist', function(req, res, next) {
    book.delWishlist(req,res,next)
});


module.exports = router;
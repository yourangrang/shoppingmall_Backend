const express =  require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');

router.post('/', auth, async (req, res, next) => {
    try {
        const product = new Product(req.body);
        product.save();
        return res.sendStatus(201);
    } catch (error) {
        next(error);
    }
})


module.exports = router
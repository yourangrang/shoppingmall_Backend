const express =  require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload = multer({ storage: storage }).single('file')

router.post('/image', auth, async (req, res, next) => {
    
    upload(req, res, err => {
        if (err) {
            return req.statusCode(500).send(err);
        }
            return res.json({ fileName: res.req.file.filename})
    })
}) //파일업로드

router.get('/', async (req, res, next) => {
    const order = req.query.order ? req.query.order : 'desc';
    const sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const skip = req.query.skip ? Number(req.query.skip) : 0;

    let findArgs = {};
    for (let key in req.query.filters) {
        if (req.query.filters[key].length > 0) {
            findArgs[key] = req.query.filters[key];
        }
    }

    console.log(findArgs);

    try {
        const products = await Product.find(findArgs)
        .populate('writer')
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)

        const productsTotal = await Product.countDocuments(findArgs);
        const hasMore = skip + limit < productsTotal ? true : false;

        return res.status(200).json({
            products,
            hasMore
        })
        
    } catch (error) {
        next(error);
    }
}) //products데이터 가져오기

router.post('/', auth, async (req, res, next) => {
    try {
        const product = new Product(req.body);
        product.save();
        return res.sendStatus(201);
    } catch (error) {
        next(error);
    }
}) //상품등록


module.exports = router
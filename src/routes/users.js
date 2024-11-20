const express = require('express');
const User = require('../models/User');
const router = express.Router();
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const async = require('async');



router.get('/auth', auth, async (req, res, next) => {

    return res.json({
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        image: req.user.image,
        cart: req.user.cart,
        history: req.user.history
    })
}) //인증


router.post('/register', async (req, res, next) =>{
    try {
        const user = new User(req.body);
        await user.save();
        return res.sendStatus(200);
    } catch (error) {
        next(error)
    }
}) // 회원가입

router.post('/login', async (req, res, next) =>{
    try {
       //존재하는 유저인지 체크
       const user = await User.findOne({ email: req.body.email});

       if(!user) {
          return res.status(400).send("Auth failed, email not found");
       }

       // 비밀번호가 올바른 것인지 체크
       const isMach = await user.comparePassword(req.body.password);
       if(!isMach) {
          return res.status(400).send('Wrong password');
       }

       const payload = {
          userId: user._id.toHexString(),
       }
 
       // token생성
       const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h' })

       return res.json({ user, accessToken });

    } catch (error) {
        next(error)
    }
}) // 로그인


router.post('/logout', auth, async (req, res, next) =>{
    try {
        return res.sendStatus(200);
    } catch (error) {
        next(error)
    }
}) // 로그아웃


router.post('/cart', auth, async (req, res, next) => {
    try {

        const { productId, size } = req.body;  // productId와 size를 요청 본문에서 받음11.13
        
        // User Collection에 해당 유저의 정보 가져오기
        const userInfo = await User.findOne({ _id: req.user._id})

        // 가져온 정보중 카트에 넣으려하는 정보와 같은게 있는지 확인
        let duplicate = false;
        userInfo.cart.forEach((item) => {
            if(item.id === req.body.productId && item.size === size) { //11.13
                duplicate = true;
            }
        })

        // 같은 상품이 이미 있을 때
        if (duplicate) {
            const user = await User.findOneAndUpdate(
                { _id: req.user._id, "cart.id": req.body.productId, "cart.size": size  },// 찾아서
                { $inc: {"cart.$.quantity": 1 } }, // 수정하고
                { new: true } //수정한걸로 업데이트하라
            )

            return res.status(201).send(user.cart);
        }
        // 같은상품이 있지 않을 때
        else {
            const user = await User.findOneAndUpdate(
                { _id: req.user._id},
                {
                    $push: {
                        cart: {
                            id: req.body.productId,
                            size: size,       // 선택된 사이즈11.13
                            quantity: 1,
                            date: Date.now()
                        }
                    }
                },
                { new: true}
            )
                return res.status(201).send(user.cart);
        }

    } catch (error) {
        next(error);
    }
}) // 카트


router.delete('/cart', auth, async (req, res, next) => {
    try {
        // 먼저 cart안에 지우려고 한 상품을 지워주기
        const userInfo = await User.findOneAndUpdate(
            { _id: req.user._id },
            {
                "$pull":
                    { "cart": { "id": req.query.productId } }
            },
            { new: true }
        )

        const cart = userInfo.cart;
        const array = cart.map(item => {
            return item.id
        })

        const productInfo = await Product
            .find({ _id: { $in: array } })
            .populate('writer')

        return res.json({
            productInfo,
            cart
        })

    } catch (error) {
        next(error);
    }
})  //카트상품지우기


router.post('/payment', auth, async (req, res) => {

    //User Collection 안에 History 필드 안에 간단한 결제정보 넣기
    let history = [];
    let transactionData = {};

    req.body.cartDetail.forEach((item) => {
        history.push({
            dateOfPurchase: new Date().toISOString(),
            name: item.title,
            id: item._id,
            price: item.price,
            quantity: item.quantity,
            paymentId: crypto.randomUUID()
        })
    })

    //Payment Collection 안에 자세한 결제 정보들 넣어주기
    transactionData.user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
    }

    transactionData.product = history;
    
    //user collection
    await User.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { history: { $each: history } }, $set: { cart: [] } }
    )

    //payment collection
    const payment = new Payment(transactionData);
    const paymentDocs = await payment.save();

    let products = [];
    paymentDocs.product.forEach(item => {
        products.push({ id: item.id, quantity: item.quantity})
    })

    //sold수량 증가 작업을 eachSeries사용해 직렬처리 한이유: 순차적처리로 업데이트 충돌방지 위해
    async.eachSeries(products, async (item) => {
        await Product.updateOne(
            {_id: item.id},
            {
                $inc: {
                    "sold": item.quantity
                }
            }
        )
    },
    (err) => {
        if(err) return res.status(500).send(err)
        return res.sendStatus(200)
    })

})

module.exports = router
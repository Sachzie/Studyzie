const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const express = require('express');
const router = express.Router();
const { sendPushNotification } = require('../utils/pushNotifications');

const statusLabels = {
    "0": "Cancelled",
    "1": "Delivered",
    "2": "Shipped",
    "3": "Pending",
};

router.get(`/`, async (req, res) =>{
    const orderList = await Order.find()
        .populate('user', 'name image')
        .populate({
            path: 'orderItems',
            populate: { path: 'product', populate: 'category' }
        })
        .sort({'dateOrdered': -1});

    if(!orderList) {
        return res.status(500).json({success: false})
    } 
    res.send(orderList);
})

router.get(`/:id`, async (req, res) =>{
    const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({ 
        path: 'orderItems', populate: { 
            path : 'product', populate: 'category'} 
        });

    if(!order) {
        res.status(500).json({success: false})
    } 
    res.send(order);
})

router.post('/', async (req,res)=>{
    try {
        const orderItemsPayload = Array.isArray(req.body.orderItems) ? req.body.orderItems : [];

        const resolveProductId = (item) => {
            if (!item) return null;
            if (typeof item.product === "string") return item.product;
            if (item.product && typeof item.product === "object") {
                return item.product._id || item.product.id || null;
            }
            return item.product || item.id || item._id || null;
        };

        const orderItemsIdsResolved = await Promise.all(orderItemsPayload.map(async (orderItem) =>{
            const productId = resolveProductId(orderItem);
            if (!productId) {
                throw new Error("Each order item must include a product id.");
            }

            let newOrderItem = new OrderItem({
                quantity: Number(orderItem.quantity) || 1,
                product: productId
            })

            newOrderItem = await newOrderItem.save();

            return newOrderItem._id;
        }));

        const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
            const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
            const totalPrice = orderItem.product.price * orderItem.quantity;
            return totalPrice
        }))

        const totalPrice = totalPrices.reduce((a,b) => a +b , 0);

        let order = new Order({
            orderItems: orderItemsIdsResolved,
            shippingAddress1: req.body.shippingAddress1,
            shippingAddress2: req.body.shippingAddress2,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            status: req.body.status,
            totalPrice: totalPrice,
            user: req.body.user,
        })
        order = await order.save();

        if(!order)
        return res.status(400).send('the order cannot be created!')

        res.send(order);
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || "Order creation failed" });
    }
})

router.put('/:id',async (req, res)=> {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status
            },
            { new: true}
        ).populate('user', 'name pushToken');

        if(!order)
            return res.status(400).send('the order cannot be update!')

        // Send remote push notification if user has a push token
        if (order.user && order.user.pushToken) {
            const statusName = statusLabels[req.body.status] || "Updated";
            const orderIdShort = order.id.slice(-6);
            
            await sendPushNotification(
                order.user.pushToken,
                "📦 Order Status Updated!",
                `Your order #${orderIdShort} is now ${statusName.toUpperCase()}. Tap to view details.`,
                { 
                    screen: 'My Orders', 
                    orderId: order.id 
                }
            ).catch(err => console.log("Failed to send remote notification:", err.message));
        }

        res.send(order);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
})

router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "order not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

router.get('/get/totalsales', async (req, res)=> {
    const totalSales= await Order.aggregate([
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}}
    ])

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales})
})

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Order.countDocuments()

    if(!orderCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid})
        .populate('user', 'name image')
        .populate({ 
        path: 'orderItems', populate: { 
            path : 'product', populate: 'category'} 
        }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})

module.exports = router;

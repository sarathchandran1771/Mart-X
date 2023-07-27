const mongoose = require("mongoose");
const schema= mongoose.Schema;

const referralsSchema=new schema({

    name: String,
    email: String,
    userPhone: String,
    userId: String,
    total: Number,
    eligibleCredit: Number,
    date: Date,
    status: String


});

const referralsModel = mongoose.model("referrals", referralsSchema);
module.exports=referralsModel;
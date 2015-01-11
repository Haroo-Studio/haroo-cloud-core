var i18n = require('i18next');

var feedback = require('../lib/feedback');
var common = require('../lib/common');

var Account = require('../models/account');
var AccountToken = require('../models/accountToken');

// signup
exports.createAccount = function (req, res, next) {
    var params = {
        email: req.params['email'],
        password: req.params['password'],
        nickname: req.params['nickname'],
        joinFrom: req.params['client_id'],
        accessHost: res.accessHost,
        accessIP: res.accessIP,
        database: res.coreDatabase['host']
    };

    var msg, client, result;

    Account.findOne({ email: params.email }, function(err, existUser) {
        if (err || existUser) {
            msg = i18n.t('account.create.exist');
            result = feedback.done(msg, params);

            return res.json(result);
        }

        // make new account
        var haroo_id = common.initHarooID(params.email, res.coreDatabase);

        if (!haroo_id) {
            //throw new Error('no exist haroo id!');
            msg = i18n.t('account.create.fail');
            result = feedback.done(msg, params);

            return res.json(result);
        }

        var user = new Account({
            email: params.email,
            password: params.password,
            haroo_id: haroo_id,
            join_from: params.joinFrom,
            db_host: params.database,
            created_at: Date.now(),
            profile: {
                nickname: params.nickname
            }
        });

        // init couch collection for account
        common.initAccountDatabase(haroo_id, res.coreDatabase);

        // save account to mongo
        user.save(function (err) {
            if (err) {
                msg = i18n.t('account.create.fail');
                result = feedback.done(msg, err);

                return res.json(result);
            }

            // make new account token
            var token = new AccountToken({
                access_ip: params.accessIP,
                access_host: params.accessHost,
                access_token: common.getAccessToken(),
                haroo_id: haroo_id,
                login_expire: common.getLoginExpireDate(),
                created_at: Date.now()
            });

            token.save(function (err) {
                if (err) {
                    msg = i18n.t('token.create.fail');
                    result = feedback.done(msg, err);

                    return res.json(result);
                }
                //AccountLog.signUp({email: params['email']});

                // done right
                msg = i18n.t('account.create.done');
                client = common.setDataToClient(user, token);

                result = feedback.done(msg, client);

                res.json(result);
            });
        });
    });
    next();
};

// login
exports.readAccount = function (req, res, next) {
    var params = {
        email: req.params['email'],
        password: req.params['password'],
        accessHost: res.accessHost,
        accessIP: res.accessIP
    };

    var msg, client, result;

    Account.findOne({email: params.email}, function (err, user) {
        if (!user) {
            msg = i18n.t('account.read.fail');
            result = feedback.done(msg, params);

            return res.json(result);
        }
        user.comparePassword(params.password, function (err, isMatch) {
            if (isMatch) {
                msg = i18n.t('account.read.done');
                client = common.setDataToClient(user);
                result = feedback.done(msg, client);

                res.json(result);
            } else {
                msg = i18n.t('account.read.mismatch');
                result = feedback.done(msg, params);

                res.json(result);
            }
        });
    });

    next();
};

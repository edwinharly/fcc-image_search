'use strict';

const express = require('express');
const app = express();
const Bing = require('node-bing-api')({ accKey: "323579544b004b77b649ca6de3ebf97c" });
const MongoClient = require('mongodb').MongoClient;
const dbUrl = 'mongodb://edwinharly:edwinharly@ds133271.mlab.com:33271/fccimagesearch';
const assert = require('assert');

app.get('/', (req, res) => {
     res.sendFile(__dirname + '/home.html');
});

app.get('/api/imagesearch/:keyword', (req, res) => {
    let keyword = req.params.keyword;
    let bnyk = req.query.offset || 10;
    let now = new Date();
    now = now.toISOString();
    
    Bing.images(keyword, {
        count: bnyk,
        offset: 0,
        adult: 'Strict',
        market: 'en-US',
    }, (error, result, body) => {
        if (error) { console.error(error) }
        // console.log(body.value);
        // url, snippet, thumbnail, context
        let hasil = [];
        for (let item of body.value) {
            let tmp = {
                url: '',
                snippet: '',
                thumbnail: '',
                context: ''
            };
            // console.log(item.contentUrl);
            // console.log(item.name);
            // console.log(item.thumbnailUrl);
            // console.log(item.hostPageUrl);
            tmp.url = item.contentUrl;
            tmp.snippet = item.name;
            tmp.thumbnail = item.thumbnailUrl;
            tmp.context = item.hostPageUrl;
            hasil.push(tmp);
        }
        
        MongoClient.connect(dbUrl, function(err, db) {
            assert.equal(null, err);
            // console.log("Connected correctly to server");
    
            // Insert a single document
            db.collection('history').insert({ term:keyword, when:now }, function(err, r) {
                assert.equal(null, err);
                // assert.equal(1, r.insertedCount);
    
                db.close();
            });
        });
        
        res.send(hasil);
    });
});

app.get('/api/latest/imagesearch', (req, res) => {
    let recent = [];
    
    MongoClient.connect(dbUrl, (err, db) => {
        assert.equal(null, err);
        
        db.collection('history').find({},{ "_id":0 }).sort({ "when":-1 }).limit(10).toArray((err, docs) => {
            assert.equal(null, err);
            db.close();
            res.send(docs);
        })
    })
});

app.listen(process.env.PORT || 8080, () => {
    console.log('Server is running on port 8080');
});
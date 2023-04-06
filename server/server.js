const express = require('express');
const path = require('path');
const providerModel = require('./model/provider.model');
const review_detailModel = require('./model/review_detail.model');
const average = require('./utils/average');
const { validEmail, isNotEmpty, validScore } = require('./utils/inputValidation');


function setupServer () {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.resolve(__dirname, '../client/build')))

  // add endpoints here

  app.get('/api/hello', (req, res) => {
    res.send('world')
  });

  app.get('/api/providers', async (req, res) => {
    const providerInfo = await providerModel.providerInfo();

    const overallScores = await review_detailModel.overallScores().catch((err) => console.error(err));

    for (let i = 0; i < overallScores.length; i++) {
      providerInfo[i].overall = Number(overallScores[i].overall)
    }

    res.send(providerInfo); 
  });

  app.get('/api/provider/:providerid', async (req, res) => {
    const provideId = Number(req.params.providerid);
    let providerInfo = await providerModel.providerInfoByID(provideId);

      // console.log('🍒', providerInfo)
    if (providerInfo.length === 0) {
      res.status(404).send("providerId not found")
    } else {
      providerInfo = providerInfo[0]
      const reviews = await review_detailModel.reviews(provideId);
  
      let averageOverall = Number(average(reviews.map((element) => {
        return element.overall;
      })).toFixed(2));
      let averageEOU = Number(average(reviews.map((element) => {
        return element.ease_of_use;
      })).toFixed(2));
      let averageCoverage = Number(average(reviews.map((element) => {
        return element.coverage;
      })).toFixed(2));
      let averagePrice = Number(average(reviews.map((element) => {
        return element.price;
      })).toFixed(2));
      let averageService = Number(average(reviews.map((element) => {
        return element.customer_service;
      })).toFixed(2));
  
      providerInfo.overall = averageOverall;
      providerInfo.ease_of_use = averageEOU;
      providerInfo.coverage = averageCoverage;
      providerInfo.price = averagePrice;
      providerInfo.customer_service = averageService;
      
      // console.log(provideId);
      // console.log(providerInfo);
      // console.log(reviews);
      // console.log(averageOverall);
  
      res.send([providerInfo, reviews]);

    }
  });

  app.post('/api/review', async (req,res) => {
    const review = req.body;
    const testEmail = await review_detailModel.testEmail(review.email);

    if (
      !isNotEmpty(review.provider_id) ||
      !isNotEmpty(review.reviewer_name) ||
      !validEmail(review.email) ||
      !validScore(review.overall) ||
      !validScore(review.ease_of_use) ||
      !validScore(review.coverage) ||
      !validScore(review.price) ||
      !validScore(review.customer_service) ||
      !isNotEmpty(review.customer_review)
    ) {
      res.status(400).send("Invalid request.");
      return;
    }

    // console.log(testEmail);
    // console.log(review.email);
    if(testEmail.length === 0) { // this email has never been used
      const insertion = await review_detailModel.insertion(review);

        // console.log(review);
        // console.log(insertion);

        res.status(200).send("Your review has been added.");
    } else {
        // console.log('line 143', review.provider_id, testEmail[0].provider_id);

        let wasUsedWithProvider = false;

        for (let i = 0; i < testEmail.length; i++) {
          if(review.provider_id === testEmail[i].provider_id) {
            wasUsedWithProvider = true
          }
        }

      if(wasUsedWithProvider) { // this email has already been used to review the current provider.
        res.status(400).send("This email has already been used for this provider.");
      } else { // this email has been used, but for a different provider
        const insertion = await review_detailModel.insertion(review);
      
        res.status(200).send("Your review has been added.");
      }
    }
  });

  app.get('/api/reviews', async (req, res) => {
    const email = req.body;

    if (!validEmail(email)) {
      res.status(400).send("The email address provided was invalid.");
      return;
    }

    const reviews = await review_detailModel.testEmail(email);
    if (reviews.length > 0) {
      res.status(200).send(reviews);
    } else {
      res.status(404).send("No reviews associated with the provided email address were found.");
    }
  });
  
  return app;
}

module.exports = setupServer;
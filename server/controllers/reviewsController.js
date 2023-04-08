const express = require("express");
const router = express.Router();
const review_detailModel = require('../model/review_detail.model');
const providerModel = require('../model/provider.model');
const { validEmail, isNotEmpty, isInteger, validScore } = require('../utils/inputValidation');

router.post('/', async (req,res) => {
  const review = req.body;
  const testEmail = await review_detailModel.getAlltestEmails(review.email);

  if (
    !isInteger(review.provider_id) ||
    !isNotEmpty(review.reviewer_name) ||
    !validEmail(review.email) ||
    !validScore(review.overall) ||
    !validScore(review.ease_of_use) ||
    !validScore(review.coverage) ||
    !validScore(review.price) ||
    !validScore(review.customer_service) ||
    !isNotEmpty(review.customer_review)
  ) {
    return res.status(400).send("Invalid request.")
  }

  if (testEmail.length === 0) { // if email has never been used
    const insertion = await review_detailModel.insertReview(review);

    res.status(200).send("Your review has been added.");
  } else {

    let wasUsedWithProvider = false;

    for (let i = 0; i < testEmail.length; i++) {
      if(review.provider_id === testEmail[i].provider_id) {
        wasUsedWithProvider = true
      }
    }

    if (wasUsedWithProvider) { // if email has already been used to review the current provider.
      res.status(400).send("This email has already been used for this provider.");
    } else { // else, this email has been used, but for a different provider
      const insertion = await review_detailModel.insertReview(review);
      
      res.status(200).send("Your review has been added.");
    }
  }
});

router.get('/:providerIdOrName', async (req,res) => {
  //check the number of providers
  const arrayOfNumProviders = await providerModel.countNumOfProviders();
  const numOfProviders = arrayOfNumProviders[0]['count'];

  // check if providerIdOrName is id or name
  let providerIdOrName = req.params.providerIdOrName;
  let providerId;

  if (isNaN(providerIdOrName)) {
    let arrayOfId = await providerModel.getProviderIdByName(providerIdOrName);

    if (arrayOfId.length === 0) {
      return res.status(404).send("The provider does't exist in the review website.");
    } else {
      providerId = arrayOfId[0]['id'];
    }
  } else {
    if (providerId > numOfProviders) {
      return res.status(404).send("providerId not found");
    } else {
      providerId = Number(providerIdOrName);
    }
  }

  // check how many reviews each provider has
  const arrayOfNumReviews = await review_detailModel.countNumOfReviews(providerId);
  const numOfReviews = arrayOfNumReviews[0]['count'];

  let limit;
  let offset;

  // if there is "limit=?" in query parameter
  if (req.query.limit) {
    if (
      parseInt(req.query.limit) <= 0 ||
      parseInt(req.query.limit) > numOfReviews
    ) {
      return res.status(404).send("Index is out of range");
    } else if (
      parseInt(req.query.limit) > 0 ||
      parseInt(req.query.limit) <= numOfReviews
    ) {
      limit = parseInt(req.query.limit);
    }
  } else {
    limit = numOfReviews;
  }
   // if there is "offset=?" in query parameter
  if (req.query.offset) {
    if (
      parseInt(req.query.offset) < 0 ||
      parseInt(req.query.offset) > numOfReviews
    ) {
      return res.status(404).send("offset is out of range");
    } else if (
      parseInt(req.query.offset) >= 0 ||
      parseInt(req.query.offset) <= numOfReviews
    ) {
      offset = parseInt(req.query.offset);
    }
  } else {
    offset = 0;
  }
  let reviewInfo = await review_detailModel.getReviewInfobyLimitOffset(providerId, limit, offset);
  res.status(200).send(reviewInfo);
})

module.exports = router;
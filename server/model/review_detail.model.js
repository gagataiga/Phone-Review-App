const knex = require('../../db/index');

const REVIEW_DETAIL_TABLE = 'review_detail';

module.exports = {
    REVIEW_DETAIL_TABLE,
    overallScores() {
        return knex(REVIEW_DETAIL_TABLE)
            .avg('overall as overall')
            .groupBy('provider_id')
            .orderBy('provider_id');
    },
    reviews(provideId) {
        return knex(REVIEW_DETAIL_TABLE)
            .select('reviewer_name', 'overall', 'ease_of_use', 'coverage','price', 'customer_service', 'customer_review')
            .where('provider_id', provideId)
            .orderBy('id', 'desc')
            .timeout(1500);
    },
    testEmail(email) {
        return knex(REVIEW_DETAIL_TABLE)
            .select('*')
            .where('email', email)
            .timeout(1500);
    },
    insertion(review) {
        return knex(REVIEW_DETAIL_TABLE)
            .insert(review);
    }
}
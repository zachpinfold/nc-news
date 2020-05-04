const connection = require('../connection')

exports.selectTopics = () => {
    return connection
    .select('*')
    .from('topics')
    .returning('*')
    .then((data) => {
        return data
    })
}